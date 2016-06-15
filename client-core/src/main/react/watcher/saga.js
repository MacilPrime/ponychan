import config from '../../config';
import $ from 'jquery';
import {call, put, fork, select} from 'redux-saga/effects';

import {log_error} from '../../logger';
import delay from '../../lib/delay';
import * as actions from './actions';

export function* loadWatchedThreads() {
  let watchedThreads = {};
  try {
    watchedThreads = JSON.parse(localStorage.getItem('watched_threads'));
  } catch (err) {
    console.error("Couldn't read localStorage", err); //eslint-disable-line
  }
  yield put(actions.setWatchedThreads(watchedThreads));
}

function requestWatcher(watchedThreads) {
  return Promise.resolve($.ajax({
    url: config.site.siteroot+'watcher/threads',
    data: {ids: Object.keys(watchedThreads).sort()},
    dataType: 'json'
  })).then(data => {
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  });
}

export function* refresher() {
  while (true) {
    try {
      const watchedThreads = yield select(s => s.watcher.watchedThreads);
      const data = yield call(requestWatcher, watchedThreads);

      if (data.scripts) {
        for (let i=0; i<data.scripts.length; i++) {
          try {
            Function(data.scripts[i])();
          } catch (e) {
            log_error(e);
          }
        }
      }

      yield put(actions.requestComplete(data));
    } catch (err) {
      console.error("Failed to refresh watched threads", err); //eslint-disable-line
    }

    //TODO scale this up when errors or inactivity happens
    yield call(delay, 30*1000);
  }
}

export default function* root() {
  yield* loadWatchedThreads();

  yield [
    fork(refresher)
  ];
}
