export const RELOAD_WATCHED_THREADS = 'RELOAD_WATCHED_THREADS';
export const SET_WATCHER_MOD_STATUS = 'SET_WATCHER_MOD_STATUS';
export const SET_WATCHED_THREADS = 'SET_WATCHED_THREADS';
export const WATCH_THREAD = 'WATCH_THREAD';
export const UNWATCH_THREAD = 'UNWATCH_THREAD';
export const WATCHER_REQUEST_COMPLETE = 'WATCHER_REQUEST_COMPLETE';

export function reloadWatchedThreads() {
  return {
    type: RELOAD_WATCHED_THREADS
  };
}

export function setWatcherModStatus(isMod) {
  return {
    type: SET_WATCHER_MOD_STATUS,
    payload: isMod
  };
}

export function setWatchedThreads(payload) {
  return {
    type: SET_WATCHED_THREADS,
    payload
  };
}

export function watchThread(id, data) {
  return {
    type: WATCH_THREAD,
    payload: {id, data}
  };
}

export function unwatchThread(id) {
  return {
    type: UNWATCH_THREAD,
    payload: {id}
  };
}

export function requestComplete(response, timestamp=Date.now()) {
  return {
    type: WATCHER_REQUEST_COMPLETE,
    payload: {response, timestamp}
  };
}
