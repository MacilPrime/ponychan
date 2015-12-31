/* @flow */

import uuid from 'uuid';
import {predis} from './database';
import config from './config';

export default async function startTask(
  userhash: string, cb: () => Promise<string>
): Promise<string> {
  const taskUuid = uuid.v4();
  const key = `tasks_${taskUuid}`;

  await new Promise((resolve, reject) => {
    predis.setex(key, config.task_cache_time, JSON.stringify({
      userhash, status: 'RUNNING'
    }), (err) => { if (err) reject(err); else resolve(); });
  });

  (async () => {
    try {
      const url = await cb();
      await new Promise((resolve, reject) => {
        predis.setex(key, config.task_cache_time, JSON.stringify({
          userhash, status: 'COMPLETE', url
        }), (err) => { if (err) reject(err); else resolve(); });
      });
    } catch(err) {
      // TODO unified error logging
      console.error(err);
      console.error(err.stack);
      await new Promise((resolve, reject) => {
        predis.setex(key, config.task_cache_time, JSON.stringify({
          userhash, status: 'ERROR', message: err.message
        }), (err) => { if (err) reject(err); else resolve(); });
      });
    }
  })();

  return `/api/v1/tasks/${taskUuid}`;
}
