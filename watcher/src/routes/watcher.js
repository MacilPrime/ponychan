/* @flow */
//jshint ignore:start

import _ from 'lodash';
import crypto from 'crypto';
import RSVP from 'rsvp';

import {credis, predis, mysql, mysql_query, c_get} from '../database';
import config from '../config';

function getThreadCount(thread: string): Promise<{reply_count: ?number, last_reply_time: ?number}> {
  const match = /^(\w+):(\d+)$/.exec(thread);
  if (!match) {
    return RSVP.Promise.reject(new Error('Improper thread specification'));
  }

  const [, board, threadid] = match;

  const thread_redis_entry = config.redis.prefix+'thread_'+thread+'_reply_count';

  return c_get(thread_redis_entry).then(value => {
    if (value != null)
      return JSON.parse(value);

    const sql_query = mysql_query('SELECT COUNT(*) AS `count` FROM `posts_'+board+'` WHERE `id` = ? AND `thread` IS NULL', [threadid]).then(check_result => {
      if (check_result[0][0].count == 0)
        return {reply_count: null, last_reply_time: null};
      return RSVP.Promise.all([
        mysql_query('SELECT COUNT(*) AS `replies` FROM `posts_'+board+'` WHERE `thread` = ?', [threadid]),
        mysql_query('SELECT `time` FROM `posts_'+board+'` WHERE `thread` = ? OR `id` = ? ORDER BY `id` DESC LIMIT 1', [threadid, threadid])
      ]).then(([count_result, time_result]) => {
        const last_reply_time = (time_result[0].length ? parseInt(time_result[0][0].time) : null);
        return {reply_count: parseInt(count_result[0][0].replies), last_reply_time};
      });
    }).catch(err => {
      if (!err.fatal && err.code == 'ER_NO_SUCH_TABLE')
        return {reply_count: null, last_reply_time: null};
      else
        throw err;
    });
    sql_query.then(value => {
      credis.setex(thread_redis_entry, config.redis.cache.expire_time, JSON.stringify(value));
    });
    return sql_query;
  });
}

function getThreadCounts(threads) {
  const promises = threads.map(thread =>
    getThreadCount(thread).then(value => [thread, value])
  );

  return RSVP.Promise.all(promises).then((all) => {
    return _.zipObject(all.map(item => item[0]), all.map(item => item[1]));
  });
}

function getScripts(userhash: string): Promise<?Array<string>> {
  return new RSVP.Promise((resolve, reject) => {
    const sets = [config.redis.prefix+'scripts_all'];
    console.log('userhash', userhash);
    if (userhash)
      sets.push(config.redis.prefix+'scripts_user_'+userhash);

    credis.sunion(sets, (err, scripts) => {
      if (err)
        reject(err);
      else
        resolve(scripts);
    });
  });
}

async function getReportCount(): Promise<number> {
  const result = await mysql_query('SELECT COUNT(*) AS count FROM `reports`');
  return result[0][0].count;
}

export default async function watcher(req: Object, res: Object, next: Function): any {
  try {
    const threadIds = req.query.ids || [];
    if (!Array.isArray(threadIds)) {
      res.status(400);
      res.send({error: "Thread list not given!"});
      return;
    }
    if (threadIds.length > config.max_watched_threads) {
      res.status(400);
      res.send({error: "Too many threads requested!"});
      return;
    }

    res.setHeader("Cache-Control", "private, max-age="+config.http_cache_time);

    const threads = await getThreadCounts(threadIds);
    const scripts = await getScripts(req.userhash);

    const response: Object = {threads};
    if (scripts && scripts.length) {
      response.scripts = scripts;
    }
    if (req.mod && req.mod.type >= config.board.permissions.reports) {
      response.mod = {
        report_count: await getReportCount()
      };
    }
    res.send(response);
  } catch(err) {
    next(err);
  }
}
