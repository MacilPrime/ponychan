/* @flow */
//jshint ignore:start

import config from './config';
import * as db from './database';
import crypto from 'crypto';

function mkhash(username: string, passhash: string, salt: string): string {
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

export default function checkMod(req: Object, res: Object, next: Function) {
  (async function(): Promise<?Object> {
    const modCookie = req.cookies.mod;
    if (!modCookie) {
      return;
    }
    const [username, hash, salt] = decodeURIComponent(modCookie).split(':');
    const result = await db.mysql_query(
      'SELECT `id`, `type`, `boards`, `password` FROM `mods` WHERE `username` = ? LIMIT 1',
      [username]
    );
    if (result.length == 0) {
      return;
    }
    const {type, boards, password} = result[0][0];
    if (hash !== mkhash(username, password, salt)) {
      return;
    }
    return {type, boards};
  })().then(mod => {
    req.mod = mod ? mod : null;
    next();
  }, next);
}
