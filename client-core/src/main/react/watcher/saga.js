import config from '../../config';
import {stringify} from 'querystring';
import {call, put, select, take, cancel, fork} from 'redux-saga/effects';

import {log_error} from '../../logger';
import delay from '../../lib/delay';
import * as actions from './actions';

export function* setModStatus() {
  const isModPage = global.document &&
    document.location.pathname == config.site.siteroot+'mod.php';
  if (isModPage) {
    yield put(actions.setWatcherModStatus(isModPage));
  }
}

export function* loadWatchedThreads(storage) {
  let watchedThreads = {};
  try {
    const loaded = JSON.parse(storage.getItem('watched_threads'));
    if (loaded) {
      watchedThreads = loaded;
    }
  } catch (err) {
    console.error("Couldn't read localStorage", err); //eslint-disable-line
  }
  yield put(actions.setWatchedThreads(watchedThreads));
}

export function requestWatcher(watchedThreads) {
  return fetch(
    `${config.site.siteroot}watcher/threads?${stringify({ids: Object.keys(watchedThreads).sort()})}`,
    {credentials: 'same-origin'}
  ).then(response => {
    if (response.ok) {
      return response.json();
    } else {
      const error = new Error(response.statusText);
      error.response = response;
      throw error;
    }
  }).then(data => {
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  });
}

export function* refresher() {
  while (true) {
    const isMod = yield select(s => s.watcher.isMod);
    const watchedThreads = yield select(s => s.watcher.watchedThreads);
    if (!isMod && Object.keys(watchedThreads).length == 0) {
      return;
    }

    try {
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

export default function* root(storage=localStorage) {
  yield* setModStatus();
  yield* loadWatchedThreads(storage);

  let lastTask = yield fork(refresher);
  while (true) {
    yield take([actions.SET_WATCHED_THREADS, actions.WATCH_THREAD]);
    yield cancel(lastTask);
    lastTask = yield fork(refresher);
  }
}
