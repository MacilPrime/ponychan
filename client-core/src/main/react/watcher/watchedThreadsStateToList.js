/* @flow */

import {make_thread_url, make_thread50_url} from '../../lib/url';

export default function watchedThreadsStateToList(state: Object) {
  return Object.keys(state).map(id => {
    const watchedThread = state[id];

    const match = /^(\w+):(\d+)$/.exec(id);
    const board = match[1];
    const postnum = +match[2];
    let unread_hash = '';
    if (
      watchedThread.known_reply_count != null &&
      watchedThread.last_known_time > watchedThread.last_seen_time
    ) {
      unread_hash = '#unread';
    }

    return {
      ...watchedThread,
      id,
      board,
      postnum,
      url: make_thread_url(board, postnum)+unread_hash,
      url50: watchedThread.known_reply_count > 100 ?
        make_thread50_url(board, postnum)+unread_hash : null
    };
  });
}
