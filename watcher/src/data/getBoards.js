/* @flow */

import {credis, mysql_query} from '../database';

export type Board = {
  uri: string;
  title: string;
  subtitle: string;
};

export default async function getBoards(): Promise<Board[]> {
  const boards = JSON.parse(await new Promise((resolve, reject) => {
    credis.get('all_boards', (err, result) => {
      if (err) reject(err); else resolve(result);
    });
  }));
  if (boards) {
    return boards;
  }

  const [results] = await mysql_query('SELECT * FROM `boards` ORDER BY `uri`');

  credis.set('all_boards', JSON.stringify(results));

  return results;
}
