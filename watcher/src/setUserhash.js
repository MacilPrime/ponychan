/* @flow */
//jshint ignore:start

import crypto from 'crypto';

export default function setUserhash(req: Object, res: Object, next: Function) {
  let userid = req.cookies.userid;
  if (typeof userid === 'string' && /^[0-9a-f]{32}$/.exec(userid))
    req.userhash = useridhash(userid);
  else
    req.userhash = null;
  next();
}

function useridhash(userid: string): string {
  const hasher = crypto.createHash('sha256');
  hasher.update(userid);
  return hasher.digest('hex').slice(0,40);
}
