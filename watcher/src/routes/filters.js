/* @flow */

import _ from 'lodash';
import uuid from 'uuid';

import isUuid from '../util/isUuid';
import {predis, mysql, mysql_query, c_del} from '../database';
import config from '../config';
import getBoards from '../data/getBoards';
import startTask from '../startTask';

type Condition =
  {type: 'name'|'trip'|'email'|'subject'|'body'|'filename'|'ip'|'board', value: string} |
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
  const {id, timestamp, mode, parent, parent_timestamp, author, author_name} = row;
  const {conditions, action} = JSON.parse(row.filter_json);
  return {
    id, timestamp, mode, conditions, action,
    parent, parent_timestamp, author, author_name
  };
}

export async function getList(req: Object, res: Object, next: Function): any {
  try {
    const q: ?string = req.query.q;
    let where = '';
    switch (q) {
    case 'enabled':
      where = 'WHERE mode != 0';
      break;
    case '':
    case undefined:
      break;
    default:
      throw new Error('invalid q value');
    }

    const [results] = await mysql_query(
      `SELECT post_filters.id, timestamp, mode, parent, author,
      filter_json,
      mods.username AS author_name
      FROM post_filters
      LEFT JOIN mods ON post_filters.author = mods.id
      ${where}
      ORDER BY post_filters.id ASC`);
    const filters = results.map(rowToFilter);
    // TODO pagination in Link header
    res.send({
      data: filters
    });
  } catch (err) {
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
    const [filterResults] = await mysql_query(
      `SELECT post_filters.id, post_filters.timestamp, post_filters.mode,
      post_filters.author, post_filters.filter_json,
      mods.username AS author_name,
      post_filters.parent, parents.timestamp AS parent_timestamp
      FROM post_filters
      LEFT JOIN mods ON post_filters.author = mods.id
      LEFT JOIN post_filters AS parents ON post_filters.parent = parents.id
      WHERE post_filters.id = ?`, [id]);
    if (filterResults.length == 0) {
      res.sendStatus(404);
      return;
    }
    const [filter] = filterResults.map(rowToFilter);

    const [children] = await mysql_query(
      `SELECT id, timestamp
      FROM post_filters
      WHERE parent = ?
      ORDER BY id DESC LIMIT 100`, [id]);

    filter.children = children.map(child => ({
      id: child.id, timestamp: child.timestamp
    }));

    const [hitResults] = await mysql_query(
      `SELECT timestamp,
      INET6_NTOA(ip_data) AS ip,
      blocked, board, thread, successful_post_id,
      name, trip, capcode, email, subject,
      filename, filehash, body_nomarkup
      FROM post_filter_hits
      WHERE filter_id = ?
      ORDER BY timestamp DESC LIMIT 100`, [id]);

    filter.hits = hitResults.map(hit => ({
      timestamp: hit.timestamp,
      ip: hit.ip,
      blocked: !!hit.blocked,
      board: hit.board,
      thread: hit.thread,
      successful_post_id: hit.successful_post_id,
      name: hit.name, trip: hit.trip, capcode: hit.capcode,
      email: hit.email, subject: hit.subject,
      filename: hit.filename, filehash: hit.filehash,
      body_nomarkup: hit.body_nomarkup
    }));

    const [changeResults] = await mysql_query(
      `SELECT timestamp, \`mod\`, mods.username AS mod_name,
      old_mode, new_mode
      FROM post_filter_changes
      LEFT JOIN mods ON post_filter_changes.mod = mods.id
      WHERE filter_id = ?
      ORDER BY timestamp DESC LIMIT 100`, [id]);

    filter.history = changeResults;
    res.send(filter);
  } catch (err) {
    next(err);
  }
}

function regexClause(column: string, regexSource: string): {sql: string, values: any[]} {
  const regex = stringToRegExp(regexSource);
  return regex.ignoreCase ? {
    sql: `REGEXP_INSTR(LOWER(\`${column}\`), ?)`,
    values: [regex.source.toLowerCase()]
  } : {
    sql: `REGEXP_INSTR(\`${column}\`, ?)`,
    values: [regex.source]
  };
}

export async function previewStart(req: Object, res: Object, next: Function): any {
  // This starts a background task which generates a list of existing posts
  // which match the filter conditions in the request body. The response to
  // this request will contain a URL that the client can poll for the results.
  // Follows the guidelines in
  // http://farazdagi.com/blog/2014/rest-long-running-jobs/
  try {
    if (req.get('content-type') !== 'application/json') {
      res.status(400).send('Invalid Content-Type header');
      return;
    }
    if (!req.userhash) {
      throw new Error('userid required');
    }

    const conditions: any[] = cleanAndVerifyConditions(req.body.conditions);
    if (conditions.length === 0) {
      throw new Error('At least one condition must be given');
    }
    // TODO return a list of conditions which weren't respected

    const taskUrl = await startTask(req.userhash, () => previewTask(conditions));
    res.set('Location', taskUrl).sendStatus(202);
  } catch (err) {
    next(err);
  }
}

async function previewTask(conditions: Condition[]): Promise<string> {
  const boardLists = [];
  const clauses = conditions.map((condition:any) => {
    switch (condition.type) {
    case 'name':
      return regexClause('name', condition.value);
    case 'trip':
      return {
        sql: '`trip` = ?', values: [condition.value]
      };
    case 'email':
      return regexClause('email', condition.value);
    case 'subject':
      return regexClause('subject', condition.value);
    case 'body':
      return regexClause('body_nomarkup', condition.value);
    case 'filename':
      return regexClause('filename', condition.value);
    case 'ip':
      // TODO
      break;
    case 'board':
      boardLists.push(condition.value.split(','));
      break;
    case 'op':
      return {
        sql: condition.value ? '`thread` IS NULL' : '`thread` IS NOT NULL',
        values: []
      };
    case 'has_file':
      return {
        sql: condition.value ? '`file` IS NOT NULL' : '`file` IS NULL',
        values: []
      };
    case 'first_time_poster':
      // TODO
      break;
    default:
      throw new Error('Invalid condition type');
    }
    return {sql: '1=1', values: []};
  }).filter(x => x.sql !== '1=1');
  if (clauses.length === 0) {
    throw new Error('No supported conditions given');
  }
  const allBoardUris = (await getBoards()).map(x => x.uri);
  const boardsToSearch = _.intersection(allBoardUris, ...boardLists);
  const wherePart = clauses.map(x => x.sql).join(' AND ');
  const values = _.chain(clauses).map(x => x.values).flatten().value();
  let count = 0;
  const resultsLists = [];
  for (let board of boardsToSearch) {
    // TODO make these results consistent with whatever general posts API is
    // made later.
    const [boardResults] = await mysql_query(
      `SELECT '${board}' AS board, id, thread, subject, email, name, trip,
      capcode, body, time, thumb, thumb_uri, thumbwidth, thumbheight,
      file, file_uri, filewidth, fileheight, filesize, filename, filehash,
      INET6_NTOA(ip_data) AS ip, sticky, locked, sage, mature
      FROM \`posts_${board}\`
      WHERE ${wherePart}
      ORDER BY id DESC
      LIMIT 100`, values
    );
    resultsLists.push(boardResults);
    count += boardResults.length;
    if (count >= 100) break;
  }

  const results = _.flatten(resultsLists);
  const resultsUuid = uuid.v4();

  await new Promise((resolve, reject) => {
    predis.setex(
      `filter_preview_${resultsUuid}`,
      config.task_cache_time, JSON.stringify(results),
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  return `/api/v1/mod/filters/previews/${resultsUuid}`;
}

export async function previewGet(req: Object, res: Object, next: Function): any {
  try {
    const id = req.params.id;
    if (typeof id !== 'string' || !isUuid(id)) {
      throw new Error('Expected UUID');
    }
    const preview = JSON.parse(await new Promise((resolve, reject) => {
      predis.get(`filter_preview_${id}`, (err, result) => {
        if (err) reject(err); else resolve(result);
      });
    }));
    if (!preview) {
      res.sendStatus(404);
      return;
    }
    res.send(preview);
  } catch (err) {
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
      throw new Error('invalid mode value');
    }
    if (parent != null && typeof parent !== 'number') {
      throw new Error('parent must be null or a number');
    }
    const conditions = cleanAndVerifyConditions(req.body.conditions);
    if (conditions.length === 0) {
      throw new Error('At least one condition must be given');
    }
    const action = cleanAndVerifyAction(req.body.action);
    if (action.type === 'captcha') {
      throw new Error('captcha action not supported yet');
    }
    const filter_json = JSON.stringify({conditions, action});

    const conn = await new Promise((resolve, reject) => {
      mysql.getConnection((err, conn) => {
        if (err) reject(err); else resolve(conn);
      });
    });
    let id;
    try {
      await new Promise((resolve, reject) => {
        conn.beginTransaction(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      if (parent != null) {
        await setFilterMode(conn, req.mod.id, parent, 0);
      }
      const results = await new Promise((resolve, reject) => {
        conn.query(
          `INSERT INTO post_filters (mode, parent, filter_json, author)
          VALUES (?, ?, ?, ?)`,
          [mode, parent, filter_json, req.mod.id],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });
      await new Promise((resolve, reject) => {
        conn.commit(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      id = results.insertId;
      conn.release();
    } catch (err) {
      conn.destroy();
      throw err;
    }

    await c_del('active_post_filters');
    res.send({success: true, id});
  } catch (err) {
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
      throw new Error('invalid mode value');
    }
    const conn = await new Promise((resolve, reject) => {
      mysql.getConnection((err, conn) => {
        if (err) reject(err); else resolve(conn);
      });
    });
    try {
      // TODO make a bunch of helper functions instead of making all of these
      // promises inline here.
      await new Promise((resolve, reject) => {
        conn.beginTransaction(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      await setFilterMode(conn, req.mod.id, id, mode);
      await new Promise((resolve, reject) => {
        conn.commit(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      conn.release();
    } catch (err) {
      conn.destroy();
      throw err;
    }
    await c_del('active_post_filters');
    res.send({success: true});
  } catch (err) {
    next(err);
  }
}

async function setFilterMode(conn: Object, mod_id: ?number, id: number, mode: number) {
  const results = await new Promise((resolve, reject) => {
    conn.query(
      'SELECT mode FROM post_filters WHERE id = ?', [id],
      (err, results) => {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
  if (results.length !== 1) {
    throw new Error('Could not find filter');
  }
  const old_mode = results[0].mode;
  await new Promise((resolve, reject) => {
    conn.query(
      'UPDATE post_filters SET mode = ? WHERE id = ?',
      [mode, id],
      (err, results) => {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
  await new Promise((resolve, reject) => {
    conn.query(
      `INSERT INTO post_filter_changes (filter_id, \`mod\`, old_mode, new_mode)
      VALUES (?, ?, ?, ?)`,
      [id, mod_id, old_mode, mode],
      (err, results) => {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
}

function stringToRegExp(value: string): RegExp {
  const m = /^\/(.*)\/([i])?$/.exec(value);
  if (!m) {
    throw new Error('Could not parse value as RegExp');
  }
  return new RegExp(m[1], m[2]);
}

function cleanAndVerifyConditions(conditions: any): Array<Condition> {
  if (!Array.isArray(conditions)) {
    throw new Error('conditions must be array');
  }
  return conditions.map(condition => {
    if (!condition || typeof condition !== 'object') {
      throw new Error('condition must be object');
    }
    switch (condition.type) {
    case 'name':
    case 'email':
    case 'subject':
    case 'body':
    case 'filename':
      if (typeof condition.value !== 'string') {
        throw new Error('value must be string for given type');
      }
      stringToRegExp(condition.value);
      return {type: condition.type, value: condition.value};
    case 'trip':
    case 'board':
      if (typeof condition.value !== 'string') {
        throw new Error('value must be string for given type');
      }
      return {type: condition.type, value: condition.value};
    case 'op':
    case 'has_file':
    case 'first_time_poster':
      if (typeof condition.value !== 'boolean') {
        throw new Error('value must be boolean for given type');
      }
      return {type: condition.type, value: condition.value};
    case 'has_not_solved_captcha_in_x_minutes':
      if (typeof condition.value !== 'number') {
        throw new Error('value must be number for given type');
      }
      return {type: condition.type, value: condition.value};
    default:
      throw new Error('Unknown type');
    }
  });
}

function cleanAndVerifyAction(action: any): Action {
  if (!action || typeof action !== 'object') {
    throw new Error('action must be object');
  }
  switch (action.type) {
  case 'reject':
    return {
      type: 'reject',
      message: typeof action.message === 'string' ? action.message : null
    };
  case 'captcha':
    return {
      type: 'captcha'
    };
  case 'ban':
    if (typeof action.reason !== 'string') {
      throw new Error('ban reason must be string');
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
    throw new Error('Unknown type');
  }
}
