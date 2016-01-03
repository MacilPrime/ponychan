/* @flow */
//jshint ignore:start

import ipProtocol from '../util/ipProtocol';
import {credis, predis, mysql, mysql_query, c_get, c_del} from '../database';

export async function appeal(req: Object, res: Object, next: Function): any {
  try {
    res.setHeader("Cache-Control", "private");
    const id = Number(req.params.id);

    const ipType = ipProtocol(req.ip) === 4 ? 0 : 1;
    const [results, meta] = await mysql_query(
      `SELECT id
      FROM bans
      WHERE
      range_type = ? AND range_start <= INET6_ATON(?) AND INET6_ATON(?) <= range_end
      AND appealable = 1
      AND id = ?`, [ipType, req.ip, req.ip, id]);
    const ban = results[0];
    if (!ban) {
      throw new Error("Invalid ban id");
    }

    const {body} = req.body;
    if (typeof body !== 'string') {
      throw new Error("Missing body");
    }

    await mysql_query(
      `INSERT INTO ban_appeals (ban, is_user, body)
      VALUES (?, ?, ?)`,
      [id, 1, body]
    );

    res.render('bans/appealConfirmed.html');
  } catch(err) {
    next(err);
  }
}

export async function modappeal(req: Object, res: Object, next: Function): any {
  try {
    res.setHeader("Cache-Control", "private");
    if (!req.mod) {
      res.sendStatus(403);
      return;
    }

    const id = Number(req.params.id);

    let setAppealable = null;
    if (req.body.lock) {
      setAppealable = 0;
    }
    if (req.body.unlock) {
      setAppealable = 1;
    }
    if (setAppealable !== null) {
      const [results] = await mysql_query(
        `UPDATE bans SET appealable = ? WHERE id = ?`,
        [setAppealable, id]
      );
      if (results.affectedRows !== 1) {
        throw new Error("Could not find ban");
      }
      console.log(results);
      res.send('foo');
      return;
    }

    const {body} = req.body;
    if (typeof body !== 'string') {
      throw new Error("Missing body");
    }

    await mysql_query(
      `INSERT INTO ban_appeals (\`ban\`, \`is_user\`, \`mod\`, \`name\`, \`trip\`, \`capcode\`, \`body\`)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, 0, req.mod.id, req.mod.signed_name, req.mod.signed_trip, 'Mod' /*TODO*/, body]
    );

    res.render('bans/appealConfirmed.html');
  } catch(err) {
    next(err);
  }
}
