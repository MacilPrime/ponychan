import config from '../../config';
import isEqual from 'lodash/lang/isEqual';
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
  const currentWatchedThreads = yield select(s => s.watcher.watchedThreads);
  let loadedWatchedThreads = currentWatchedThreads;
  try {
    const loaded = JSON.parse(storage.getItem('watched_threads'));
    if (loaded) {
      loadedWatchedThreads = loaded;
    }
  } catch (err) {
    console.error("Couldn't read localStorage", err); //eslint-disable-line
  }
  if (!isEqual(currentWatchedThreads, loadedWatchedThreads)) {
    yield put(actions.setWatchedThreads(loadedWatchedThreads));
  }
}

export function* saveWatchedThreads(storage) {
  const watchedThreads = yield select(s => s.watcher.watchedThreads);
  try {
    storage.setItem('watched_threads', JSON.stringify(watchedThreads));
  } catch (err) {
    console.error("Couldn't write to localStorage", err); //eslint-disable-line
  }
}

export function requestWatcher(watchedThreads) {
  return fetch(
    `${config.site.siteroot}watcher/threads?${stringify({'ids[]': Object.keys(watchedThreads).sort()})}`,
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

export function* refresher(storage) {
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

      yield* loadWatchedThreads(storage);
      yield put(actions.requestComplete(data));
    } catch (err) {
      console.error("Failed to refresh watched threads", err); //eslint-disable-line
    }
    const newWatchedThreads = yield select(s => s.watcher.watchedThreads);
    if (!isEqual(watchedThreads, newWatchedThreads)) {
      yield* saveWatchedThreads(storage);
    }

    //TODO scale this up when errors or inactivity happens
    yield call(delay, 30*1000);
  }
}

export function* reloader(storage) {
  while (true) {
    yield take(actions.RELOAD_WATCHED_THREADS);
    yield* loadWatchedThreads(storage);
  }
}

export function* saver(storage) {
  while (true) {
    yield take([actions.WATCH_THREAD, actions.UNWATCH_THREAD]);
    yield* saveWatchedThreads(storage);
  }
}

export default function* root(storage=localStorage) {
  yield* setModStatus();
  yield* loadWatchedThreads(storage);
  yield fork(reloader, storage);
  yield fork(saver, storage);

  let lastTask = yield fork(refresher, storage);
  while (true) {
    yield take([actions.SET_WATCHED_THREADS, actions.WATCH_THREAD]);
    yield cancel(lastTask);
    lastTask = yield fork(refresher, storage);
  }
}
