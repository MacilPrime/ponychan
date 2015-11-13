/* @flow */
//jshint ignore:start

import RSVP from 'rsvp';
import mysqlModule from 'mysql';
import redis from 'redis';
import config from './config';

export const credis = redis.createClient(
  config.redis.cache.socket || config.redis.cache.port, config.redis.cache.host);
if (config.redis.cache.pass)
  credis.auth(config.redis.cache.pass);
credis.select(config.redis.cache.db);

export const predis = redis.createClient(config.redis.main.socket || config.redis.main.port, config.redis.main.host);
if (config.redis.main.pass)
  predis.auth(config.redis.main.pass);
predis.select(config.redis.main.db);

export const mysql = mysqlModule.createPool({
  connectionLimit: config.mysql.connection_limit,
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.pass,
  database: config.mysql.db
});

// Promise Helpers

export function mysql_query(query: string, vars: Array<string|number>=[]): Promise<[Object[], Object[]]> {
  return new RSVP.Promise((resolve, reject) => {
    mysql.query(query, vars, (err, ...results) => {
      if (err)
        reject(err);
      else
        resolve(results);
    });
  });
}

export const c_get: (key:string) => Promise<?string> = RSVP.denodeify(credis.get.bind(credis));
