/* @flow */

import {credis, predis, mysql, mysql_query, c_get, c_del} from '../database';
import config from '../config';

type Condition =
  {type: 'name'|'trip'|'email'|'subject'|'body'|'filename'|'ip', value: string} |
  {type: 'op'|'has_file'|'first_time_poster', value: boolean} |
  {type: 'has_not_solved_captcha_in_x_minutes', value: number};

type Action =
  {type: 'reject', message?: ?string} |
  {type: 'captcha'} |
  {
    type: 'ban';
    reason: string;
    length?: ?number;
    single_board?: ?boolean;
    ban_type?: ?number;
    message?: ?string;
  };

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

export async function create(req: Object, res: Object, next: Function): any {
  try {
    if (req.get('content-type') !== 'application/json') {
      res.status(400).send('Invalid Content-Type header');
      return;
    }
    const {mode, parent} = req.body;
    if (typeof mode !== 'number' || ![0,1,2].includes(mode)) {
      throw new Error("invalid mode value");
    }
    if (parent && typeof parent !== 'number') {
      throw new Error("parent must be null or a number");
    }
    const conditions = cleanAndVerifyConditions(req.body.conditions);
    if (conditions.length === 0) {
      throw new Error("At least one condition must be given");
    }
    const action = cleanAndVerifyAction(req.body.action);
    if (action.type === 'captcha') {
      throw new Error("captcha action not supported yet");
    }
    const filter_json = JSON.stringify({conditions, action});

    const [results, meta] = await mysql_query(
      `INSERT INTO post_filters (mode, parent, filter_json, author)
      VALUES (?, ?, ?, ?)`,
      [mode, parent, filter_json, req.mod.id]);
    const id = results.insertId;
    res.type('json');
    res.send({success: true, id});
  } catch(err) {
    next(err);
  }
}

export async function update(req: Object, res: Object, next: Function): any {
  try {
    const id = Number(req.params.id);
    if (req.get('content-type') !== 'application/json') {
      res.status(400).send('Invalid Content-Type header');
      return;
    }
    const {mode} = req.body;
    if (typeof mode !== 'number' || ![0,1,2].includes(mode)) {
      throw new Error("invalid mode value");
    }
    const [results, meta] = await mysql_query(
      `UPDATE post_filters
      SET mode = ?
      WHERE id = ?`,
      [mode, id]);
    if (results.affectedRows !== 1) {
      throw new Error("Failed to find filter with given id");
    }
    await c_del('active_post_filters');
    res.type('json');
    res.send({success: true});
  } catch(err) {
    next(err);
  }
}

function stringToRegExp(value: string): RegExp {
  const m = /^\/(.*)\/([i])?$/.exec(value);
  if (!m) {
    throw new Error("Could not parse value as RegExp");
  }
  return new RegExp(m[1], m[2]);
}

function cleanAndVerifyConditions(conditions: any): Array<Condition> {
  if (!Array.isArray(conditions)) {
    throw new Error("conditions must be array");
  }
  return conditions.map(condition => {
    if (!condition || typeof condition !== 'object') {
      throw new Error("condition must be object");
    }
    switch (condition.type) {
      case 'name':
      case 'email':
      case 'subject':
      case 'body':
      case 'filename':
      case 'ip':
        if (typeof condition.value !== 'string') {
          throw new Error("value must be string for given type");
        }
        stringToRegExp(condition.value);
        return {type: condition.type, value: condition.value};
      case 'trip':
        if (typeof condition.value !== 'string') {
          throw new Error("value must be string for given type");
        }
        return {type: condition.type, value: condition.value};
      case 'op':
      case 'has_file':
      case 'first_time_poster':
        if (typeof condition.value !== 'boolean') {
          throw new Error("value must be boolean for given type");
        }
        return {type: condition.type, value: condition.value};
      case 'has_not_solved_captcha_in_x_minutes':
        if (typeof condition.value !== 'number') {
          throw new Error("value must be number for given type");
        }
        return {type: condition.type, value: condition.value};
      default:
        throw new Error("Unknown type");
    }
  });
}

function cleanAndVerifyAction(action: any): Action {
  if (!action || typeof action !== 'object') {
    throw new Error("action must be array");
  }
  switch (action.type) {
    case 'reject':
      return {
        type: action.type,
        message: typeof action.message === 'string' ? action.message : null
      };
    case 'captcha':
      return {
        type: action.type
      };
    case 'ban':
      if (typeof action.reason !== 'string') {
        throw new Error("ban reason must be string");
      }
      return {
        type: 'ban',
        reason: action.reason,
        length: typeof action.length === 'number' ? action.length : null,
        single_board: typeof action.single_board === 'boolean' ? action.single_board : null,
        ban_type: typeof action.ban_type === 'number' ? action.ban_type : null,
        message: typeof action.message === 'string' ? action.message : null
      };
    default:
      throw new Error("Unknown type");
  }
}
