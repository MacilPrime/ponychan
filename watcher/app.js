/* @flow */
//jshint ignore:start

var _ = require('lodash');
var crypto = require('crypto');
var util = require('util');
var express = require('express');
var swig = require('swig');
var nconf = require('nconf');
var redis = require('redis');
var mysql = require('mysql');
var RSVP = require('rsvp');

RSVP.on('error', function(err) {
  console.error('uncaught RSVP promise rejection');
  throw err;
});

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
    board: {
      cookies_salt: 'test value',
      permissions: {
        reports: 0
      }
    },
    mysql: {
      connection_limit: 10,
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

var conn = mysql.createPool({
  connectionLimit: nconf.get('mysql:connection_limit'),
  host: nconf.get('mysql:host'),
  user: nconf.get('mysql:user'),
  password: nconf.get('mysql:pass'),
  database: nconf.get('mysql:db')
});

var app = express();

var max_watched_threads: number = nconf.get('max_watched_threads');
var redis_prefix: string = nconf.get('redis:prefix');
var cache_expire_time: number = nconf.get('redis:cache:expire_time');
var http_cache_time: number = nconf.get('http_cache_time');

var cdb_get: (key:string) => Promise<?string> = RSVP.denodeify(cdb.get.bind(cdb));
function conn_query(query, vars=[]): Promise<[Object[], Object[]]> {
  return new RSVP.Promise((resolve, reject) => {
    conn.query(query, vars, (err, ...results) => {
      if (err)
        reject(err);
      else
        resolve(results);
    });
  });
}

function getThreadCount(thread) {
  var match = /^(\w+):(\d+)$/.exec(thread);
  if (!match) {
    return RSVP.Promise.reject(new Error('Improper thread specification'));
  }

  var [, board, threadid] = match;

  var thread_redis_entry = redis_prefix+'thread_'+thread+'_reply_count';

  return cdb_get(thread_redis_entry).then(function(value) {
    if (value != null)
      return JSON.parse(value);

    var sql_query = conn_query('SELECT COUNT(*) AS `count` FROM `posts_'+board+'` WHERE `id` = ? AND `thread` IS NULL', [threadid]).then(function(check_result) {
      if (check_result[0][0].count == 0)
        return {reply_count: null, last_reply_time: null};
      return RSVP.Promise.all([
        conn_query('SELECT COUNT(*) AS `replies` FROM `posts_'+board+'` WHERE `thread` = ?', [threadid]),
        conn_query('SELECT `time` FROM `posts_'+board+'` WHERE `thread` = ? OR `id` = ? ORDER BY `id` DESC LIMIT 1', [threadid, threadid])
      ]).then(function([count_result, time_result]) {
        var last_reply_time = (time_result[0].length ? parseInt(time_result[0][0].time) : null);
        return {reply_count: parseInt(count_result[0][0].replies), last_reply_time};
      });
    }).catch(function(err) {
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
}

function getThreadCounts(threads) {
  var promises = threads.map(thread =>
    getThreadCount(thread).then(value => [thread, value])
  );

  return RSVP.Promise.all(promises).then((all) => {
    return _.zipObject(all.map(item => item[0]), all.map(item => item[1]));
  });
}

function getScripts(userid) {
  return new RSVP.Promise((resolve, reject) => {
    var sets = [redis_prefix+'scripts_all'];
    if (userid)
      sets.push(redis_prefix+'scripts_user_'+userid);

    cdb.sunion(sets, (err, scripts) => {
      if (err)
        reject(err);
      else
        resolve(scripts);
    });
  });
}

function checkUserid(req, res, next) {
  var userid = req.cookies.userid;
  if (typeof userid === 'string' && /^[0-9a-f]{32}$/.exec(userid))
    req.userid = userid;
  else
    req.userid = null;
  next();
}

function sha1(str: string): Buffer {
  var hasher = crypto.createHash('sha1');
  hasher.update(str);
  return hasher.digest('base64');
}

function mkhash(username: string, passhash: string, salt: string): string {
  var hasher = crypto.createHash('md5');
  hasher.update(username);
  hasher.update(nconf.get('board:cookies_salt'));

  var innerHasher = crypto.createHash('sha1');
  innerHasher.update(username);
  innerHasher.update(passhash);
  innerHasher.update(salt);
  hasher.update(innerHasher.digest());
  return hasher.digest('base64').slice(0, 20);
}

function checkMod(req, res, next) {
  (async function(): Promise<?Object> {
    var modCookie = req.cookies.mod;
    if (!modCookie) {
      return;
    }
    var [username, hash, salt] = decodeURIComponent(modCookie).split(':');
    var result = await conn_query(
      'SELECT `id`, `type`, `boards`, `password` FROM `mods` WHERE `username` = ? LIMIT 1',
      [username]
    );
    if (result.length == 0) {
      return;
    }
    var {type, boards, password} = result[0][0];
    if (hash !== mkhash(username, password, salt)) {
      return;
    }
    return {type, boards};
  })().then(mod => {
    req.mod = mod ? mod : null;
    next();
  }, next);
}

async function getReportCount(): Promise<number> {
  var result = await conn_query('SELECT COUNT(*) AS count FROM `reports`');
  return result[0][0].count;
}

app.engine('html', swig.renderFile);
app.set('view engine', 'html');

app.set('views', __dirname + '/views');

app
  .use(express.logger())
  .use(express.cookieParser())
  .use(checkUserid)
  .use(checkMod);

app.get('/threads', async function(req, res, next) {
  try {
    var threadIds = req.query.ids || [];
    if (!util.isArray(threadIds)) {
      res.status(400);
      res.send({error: "Thread list not given!"});
      return;
    }
    if (threadIds.length > max_watched_threads) {
      res.status(400);
      res.send({error: "Too many threads requested!"});
      return;
    }

    res.setHeader("Cache-Control", "private, max-age="+http_cache_time);

    var threads = await getThreadCounts(threadIds);
    var scripts = await getScripts(req.userid);

    var response: Object = {threads};
    if (scripts && scripts.length) {
      response.scripts = scripts;
    }
    if (req.mod && req.mod.type >= nconf.get('board:permissions:reports')) {
      response.mod = {
        report_count: await getReportCount()
      };
    }
    res.send(response);
  } catch(err) {
    next(err);
  }
});

var port: number = nconf.get('listen:port');
var host: string = nconf.get('listen:host');

app.listen(port, host, function() {
  console.log("Now listening on "+host+":"+port);
});
