/* @flow */
//jshint ignore:start

import _ from 'lodash';
import fs from 'fs';

const config = {
  max_watched_threads: 70,
  http_cache_time: 15,
  task_cache_time: 60*60*24*2,
  task_timeout_time: 60*5,
  listen: {
    host: '',
    port: 4000
  },
  core: {
    path: "../core"
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
      db: 1
    }
  },
  board: {
    cookies_salt: 'test value',
    permissions: {
      reports: 0
    },
    boardlist: ([['b'], ['pone', 'cool']]: Array<Array<string>>)
  },
  mysql: {
    connection_limit: 10,
    host: '172.27.0.2',
    user: 'tinyboard',
    pass: '',
    db: 'tinyboard'
  }
};

export type Config = typeof config;

const CONFIG_FILENAME = __dirname+'/../config.json';

const configExists = (function() {
  try {
    fs.statSync(CONFIG_FILENAME);
    return true;
  } catch(e) {
    return false;
  }
})();
if (configExists) {
  _.merge(
    config,
    JSON.parse(fs.readFileSync(CONFIG_FILENAME, 'utf8')),
    (a, b) => Array.isArray(b) ? b : undefined
  );
}

export default config;
