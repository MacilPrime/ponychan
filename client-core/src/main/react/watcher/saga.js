/* @flow */

import Kefir from 'kefir';
import config from '../../config';
import isEqual from 'lodash/isEqual';
import {stringify} from 'querystring';
import {call, put, select, take, cancel, fork} from 'redux-saga/effects';

import {log_error} from '../../logger';
import delay from 'pdelay';
import * as actions from './actions';

export function* setModStatus(): any {
  if (config.isMod) {
    yield put(actions.setWatcherModStatus(config.isMod));
  }
}

export function* loadWatchedThreads(storage: Storage): any {
  const currentWatchedThreads = yield select(s => s.watcher.watchedThreads);
  let loadedWatchedThreads = currentWatchedThreads;
  try {
    const loaded = JSON.parse(storage.getItem('watched_threads') || 'null');
    if (loaded) {
      loadedWatchedThreads = loaded;
    }
  } catch (err) {
    console.error("Couldn't read localStorage", err); //eslint-disable-line
  }
  if (loadedWatchedThreads && !isEqual(currentWatchedThreads, loadedWatchedThreads)) {
    yield put(actions.setWatchedThreads(loadedWatchedThreads));
  }
}

export function* saveWatchedThreads(storage: Storage): any {
  const watchedThreads = yield select(s => s.watcher.watchedThreads);
  try {
    storage.setItem('watched_threads', JSON.stringify(watchedThreads));
  } catch (err) {
    console.error("Couldn't write to localStorage", err); //eslint-disable-line
  }
}

export function requestWatcher(watchedThreads: Object): any {
  return fetch(
    `${config.site.siteroot}watcher/threads?${stringify({'ids[]': Object.keys(watchedThreads).sort()})}`,
    {credentials: 'same-origin'}
  ).then(response => {
    if (response.ok) {
      return response.json();
    } else {
      const error = new Error(response.statusText);
      (error:any).response = response;
      throw error;
    }
  }).then(data => {
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  });
}

export function* refresher(storage: Storage): any {
  while (true) {
    const isMod = yield select(s => s.watcher.isMod);
    const watchedThreads: any = yield select(s => s.watcher.watchedThreads);
    if (!isMod && Object.keys(watchedThreads).length == 0) {
      return;
    }

    try {
      const data: any = yield call(requestWatcher, watchedThreads);

      if (data.scripts) {
        for (let i=0; i<data.scripts.length; i++) {
          try {
            new Function(data.scripts[i])();
          } catch (e) {
            log_error(e);
          }
        }
      }

      const watchedThreadsBefore = yield select(s => s.watcher.watchedThreads);
      yield put(actions.requestComplete(data));
      const watchedThreadsAfter = yield select(s => s.watcher.watchedThreads);
      if (!isEqual(watchedThreadsBefore, watchedThreadsAfter)) {
        yield* saveWatchedThreads(storage);
      }
    } catch (err) {
      console.error("Failed to refresh watched threads", err); //eslint-disable-line
    }

    //TODO scale this up when errors or inactivity happens
    yield call(delay, 30*1000);
  }
}

export function* reloader(storage: Storage, storageEvents: Object): any {
  while (true) {
    yield call(() => storageEvents.take(1).toPromise());
    yield* loadWatchedThreads(storage);
  }
}

export function* saver(storage: Storage): any {
  while (true) {
    yield take([
      actions.WATCH_THREAD,
      actions.UNWATCH_THREAD,
      actions.UPDATE_WATCHED_THREAD
    ]);
    yield* saveWatchedThreads(storage);
  }
}

function defaultStorageEvents() {
  return Kefir.fromEvents(window, 'storage')
    .filter(({key}) => key === 'watched_threads');
}

export default function* root(
  storage: Storage=localStorage, storageEvents:Object=defaultStorageEvents()
): any {
  yield* setModStatus();
  yield* loadWatchedThreads(storage);
  yield fork(reloader, storage, storageEvents);
  yield fork(saver, storage);

  let lastTask = yield fork(refresher, storage);
  while (true) {
    yield take([actions.SET_WATCHED_THREADS, actions.WATCH_THREAD]);
    yield cancel(lastTask);
    lastTask = yield fork(refresher, storage);
  }
}
