var util = require('util');
var express = require('express');
var swig = require('swig');
var nconf = require('nconf');
var redis = require('redis');
var mysql = require('mysql');
var toobusy = require('toobusy');
var Q = require('q');

nconf
  .argv()
  .env()
  .file('config.json')
  .defaults({
    max_watched_threads: 70,
    http_cache_time: 15,
    listen: {
      host: '',
      port: 4000
    },
    redis: {
      prefix: 'watcher_',
      main: {
        socket: false,
        host: '172.27.0.2',
        port: 6379,
        pass: '',
        db: 2
      },
      cache: {
        expire_time: 30,
        socket: false,
        host: '172.27.0.2',
        port: 6379,
        pass: '',
        db: 3
      }
    },
    mysql: {
      host: '172.27.0.2',
      user: 'tinyboard',
      pass: '',
      db: 'tinyboard'
    }
  });

var cdb = redis.createClient(nconf.get('redis:cache:socket') || nconf.get('redis:cache:port'), nconf.get('redis:cache:host'));
if (nconf.get('redis:cache:pass'))
  cdb.auth(nconf.get('redis:cache:pass'));
cdb.select(nconf.get('redis:cache:db'));

var pdb = redis.createClient(nconf.get('redis:main:socket') || nconf.get('redis:main:port'), nconf.get('redis:main:host'));
if (nconf.get('redis:main:pass'))
  pdb.auth(nconf.get('redis:main:pass'));
pdb.select(nconf.get('redis:main:db'));

var conn = mysql.createConnection({
  host: nconf.get('mysql:host'),
  user: nconf.get('mysql:user'),
  password: nconf.get('mysql:pass'),
  database: nconf.get('mysql:db')
});
conn.connect();

var app = express();

var max_watched_threads = nconf.get('max_watched_threads');
var redis_prefix = nconf.get('redis:prefix');
var cache_expire_time = nconf.get('redis:cache:expire_time');
var http_cache_time = nconf.get('http_cache_time');

var cdb_get = Q.nfbind(cdb.get.bind(cdb));
var conn_query = Q.nfbind(conn.query.bind(conn));

function getThreadCount(thread) {
  var match = /^(\w+):(\d+)$/.exec(thread);
  if (!match) {
    return {error: 'Improper thread specification'};
  }

  var board = match[1];
  var threadid = match[2];

  var thread_redis_entry = redis_prefix+'thread_'+thread+'_reply_count';

  var thread_value_job = cdb_get(thread_redis_entry).then(function(value) {
    if (value != null)
      return JSON.parse(value);

    var sql_query = conn_query('SELECT COUNT(*) AS `count` FROM `posts_'+board+'` WHERE `id` = ? AND `thread` IS NULL', [threadid]).then(function(check_result) {
      if (check_result[0][0].count == 0)
        return {reply_count: null, last_reply_time: null};
      return Q.all([
        conn_query('SELECT COUNT(*) AS `replies` FROM `posts_'+board+'` WHERE `thread` = ?', [threadid]),
        conn_query('SELECT `time` FROM `posts_'+board+'` WHERE `thread` = ? OR `id` = ? ORDER BY `id` DESC LIMIT 1', [threadid, threadid])
      ]).then(function(results) {
        var count_result = results[0];
        var time_result = results[1];

        var last_time = (time_result[0].length ? parseInt(time_result[0][0].time) : null);
        return {reply_count: parseInt(count_result[0][0].replies), last_reply_time: last_time};
      });
    }).fail(function(err) {
      if (!err.fatal && err.code == 'ER_NO_SUCH_TABLE')
        return {reply_count: null, last_reply_time: null};
      else
        throw err;
    });
    sql_query.then(function(value) {
      cdb.setex(thread_redis_entry, cache_expire_time, JSON.stringify(value));
    });
    return sql_query;
  });
  return thread_value_job;
}

function getThreadCounts(threads) {
  var promises = [];

  threads.forEach(function(thread) {
    promises.push(getThreadCount(thread).then(function(value) {return [thread, value];}));
  });

  return Q.all(promises).then(function(all) {
    var threads = {};
    for (var i in all) {
      var thread = all[i][0];
      var data = all[i][1];
      threads[thread] = data;
    }
    return threads;
  });
}

function getScripts(userid) {
  var defer = Q.defer();

  var sets = [redis_prefix+'scripts_all'];
  if (userid)
    sets.push(redis_prefix+'scripts_user_'+userid);

  cdb.sunion(sets, function(err, scripts) {
    if (err)
      defer.reject(err);
    else
      defer.resolve(scripts);
  });

  return defer.promise;
}

function checkUserid(req, res, next) {
  var userid = req.cookies.userid;
  if (typeof userid === 'string' && /^[0-9a-f]{32}$/.exec(userid))
    req.userid = userid;
  else
    req.userid = null;
  next();
}

app.engine('html', swig.renderFile);
app.set('view engine', 'html');

app.set('views', __dirname + '/views');

app
  .use(express.logger())
  .use(express.cookieParser());

app.use(function(req, res, next) {
  if (toobusy()) res.send(503, "I'm busy right now, sorry.");
  else next();
});

app.get('/threads', checkUserid, function(req, res, next) {
  var threads = req.query.ids;
  if (!util.isArray(threads)) {
    res.send({error: "Thread list not given!"});
    return;
  }
  if (threads.length > max_watched_threads) {
    res.send({error: "Too many threads requested!"});
    return;
  }

  res.setHeader("Cache-Control", "private, max-age="+http_cache_time);

  getThreadCounts(threads).then(function(threadcounts) {
    return getScripts(req.userid).then(function(scripts) {
      var data = {threads: threadcounts};
      if (scripts && scripts.length)
        data.scripts = scripts;
      res.send(data);
    });
  }).fail(next);
});

var port = nconf.get('listen:port');
var host = nconf.get('listen:host');

app.listen(port, host, function() {
  console.log("Now listening on "+host+":"+port);
});
