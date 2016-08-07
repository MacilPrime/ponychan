/* @flow */

import {predis} from '../database';
import config from '../config';
import isUuid from '../util/isUuid';

export async function get(req: Object, res: Object, next: Function): any {
  try {
    const id = req.params.id;
    if (typeof id !== 'string' || !isUuid(id)) {
      throw new Error('Expected UUID');
    }
    const task = JSON.parse(await new Promise((resolve, reject) => {
      predis.get(`tasks_${id}`, (err, result) => {
        if (err) reject(err); else resolve(result);
      });
    }));
    if (!task) {
      res.sendStatus(404);
      return;
    }
    if (!task.userhash || req.userhash !== task.userhash) {
      res.sendStatus(403);
      return;
    }
    switch (task.status) {
    case 'RUNNING':
      if (task.lastUpdated + config.task_timeout_time*1000 < Date.now()) {
        res.send({status: 'ERROR', message: 'Task timed out.'});
      } else {
        res.send({status: 'RUNNING', progress: task.progress});
      }
      break;
    case 'ERROR':
      res.status(500).send({status: 'ERROR', message: task.message});
      break;
    case 'COMPLETE':
      res.set('Location', task.url).sendStatus(303);
      break;
    default:
      throw new Error('Unknown type');
    }
  } catch (err) {
    next(err);
  }
}

export async function del(req: Object, res: Object, next: Function): any {
  try {
    res.status(501).send('Task abort not implemented yet.');
  } catch (err) {
    next(err);
  }
}
