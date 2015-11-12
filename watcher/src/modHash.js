/* @flow */
//jshint ignore:start

import crypto from 'crypto';
import config from './config';

export default function modHash(username: string, passhash: string, salt: string): string {
  const hasher = crypto.createHash('md5');
  hasher.update(username);
  hasher.update(config.board.cookies_salt);

  const innerHasher = crypto.createHash('sha1');
  innerHasher.update(username);
  innerHasher.update(passhash);
  innerHasher.update(salt);
  hasher.update(innerHasher.digest());
  return hasher.digest('base64').slice(0, 20);
}
