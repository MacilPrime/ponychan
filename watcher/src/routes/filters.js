/* @flow */

import {credis, predis, mysql, mysql_query, c_get} from '../database';
import config from '../config';

function rowToFilter(row: Object): Object {
  const {id, timestamp, mode, parent, author, author_name} = row;
  const {conditions, action} = JSON.parse(row.filter_json);
  return {id, timestamp, mode, parent, author, author_name, conditions, action};
}

export async function getList(req: Object, res: Object, next: Function): any {
  try {
    const [results, meta] = await mysql_query(
      `SELECT post_filters.id, timestamp, mode, parent, author,
      filter_json,
      mods.username AS author_name
      FROM post_filters
      LEFT JOIN mods ON post_filters.author = mods.id`);
    const filters = results.map(rowToFilter);
    res.type('json');
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
    if (!/^\d+$/.test(req.params.id)) {
      res.sendStatus(400);
      return;
    }
    const id = Number(req.params.id);
    const [results, meta] = await mysql_query(
      `SELECT post_filters.id, timestamp, mode, parent, author,
      filter_json,
      mods.username AS author_name
      FROM post_filters
      LEFT JOIN mods ON post_filters.author = mods.id
      WHERE post_filters.id = ?`,
      [id]);
    if (results.length == 0) {
      res.sendStatus(404);
      return;
    }
    const filters = results.map(rowToFilter);
    res.type('json');
    res.send(filters[0]);
  } catch(err) {
    next(err);
  }
}
