/* @flow */
//jshint ignore:start

import fs from 'fs';

const config = {
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
  Object.assign(config, JSON.parse(fs.readFileSync(CONFIG_FILENAME, 'utf8')));
}

export default config;
