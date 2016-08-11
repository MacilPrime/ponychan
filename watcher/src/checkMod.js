/* @flow */
//jshint ignore:start

import * as db from './database';
import modHash from './modHash';

export default function checkMod(req: Object, res: Object, next: Function) {
  (async function(): Promise<?Object> {
    const modCookie = req.cookies.mod;
    if (!modCookie) {
      return;
    }
    const [username, hash, salt] = decodeURIComponent(modCookie).split(':');
    const result = await db.mysql_query(
      'SELECT `id`, `type`, `boards`, `password`, `signed_name`, `signed_trip` FROM `mods` WHERE `username` = ? LIMIT 1',
      [username]
    );
    if (result[0].length == 0) {
      return;
    }
    const {id, type, boards, password, signed_name, signed_trip} = result[0][0];
    if (hash !== modHash(username, password, salt)) {
      return;
    }
    return {id, type, boards, signed_name, signed_trip};
  })().then(mod => {
    res.locals.mod = req.mod = mod ? mod : null;
    next();
  }, next);
}
