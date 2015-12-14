/* @flow */

import {credis, predis, mysql, mysql_query, c_get} from '../database';
import config from '../config';

export async function getList(req: Object, res: Object, next: Function): any {
  try {
    res.setHeader("Cache-Control", "private");
    res.type('json');
    const [results, meta] = await mysql_query('SELECT * FROM `post_filters`');
    const filters = results.map(row => {
      const {id, timestamp, mode} = row;
      const {conditions, action} = JSON.parse(row.filter_json);
      return {id, timestamp, mode, conditions, action};
    });
    res.send({
      data: filters,
      paging: { // TODO
        previous: null,
        next: null
      }
    });
  } catch(err) {
    next(err);
  }
}

export async function getOne(req: Object, res: Object, next: Function): any {
  try {
    res.type('json');
    if (!/^\d+$/.test(req.params.id)) {
      res.sendStatus(400);
      return;
    }
    const id = Number(req.params.id);
    const [results, meta] = await mysql_query(
      'SELECT * FROM `post_filters` WHERE `id` = ?',
      [id]);
    if (results.length == 0) {
      res.sendStatus(404);
      return;
    }
    const filters = results.map(row => {
      const {id, timestamp, mode, parent, author} = row;
      const {conditions, action} = JSON.parse(row.filter_json);
      return {id, timestamp, mode, parent, author, conditions, action};
    });
    res.send(filters[0]);
  } catch(err) {
    next(err);
  }
}
