import _ from 'lodash';
import * as actions from './actions';

const initialState = {
  isMod: false,
  currentThreadId: null,
  watchedThreads: {},
  lastResponse: null,
  alerts: 0
};

function countAlerts(watchedThreads, lastResponse, currentThreadId) {
  let alerts = 0;

  Object.keys(watchedThreads).forEach(id => {
    const thread = watchedThreads[id];
    if (
      thread.known_reply_count != null &&
      id !== currentThreadId &&
      thread.last_known_time > thread.last_seen_time
    ) {
      alerts++;
    }
  });

  if (lastResponse) {
    const {mod} = lastResponse;
    if (mod) {
      if (mod.report_count)
        alerts += mod.report_count;
      if (mod.open_appeals_count)
        alerts += mod.open_appeals_count;
    }
  }

  return alerts;
}

export default function reducer(state=initialState, action) {
  switch (action.type) {
  case actions.SET_CURRENT_THREAD_ID: {
    return {
      ...state,
      currentThreadId: action.payload.threadId
    };
  }
  case actions.SET_WATCHER_MOD_STATUS: {
    return {
      ...state,
      isMod: action.payload
    };
  }
  case actions.SET_WATCHED_THREADS: {
    const watchedThreads = action.payload;
    const alerts = countAlerts(watchedThreads, null, state.currentThreadId);
    return {
      ...state,
      watchedThreads,
      alerts,
      lastResponse: state.lastResponse
    };
  }
  case actions.UPDATE_WATCHED_THREAD: {
    const {id, seen_reply_count, last_seen_time} = action.payload;
    const watchedThread = state.watchedThreads[id];
    if (!watchedThread) return state;
    const watchedThreads = {
      ...state.watchedThreads,
      [id]: {
        ...watchedThread,
        seen_reply_count,
        last_seen_time
      }
    };
    return {
      ...state,
      watchedThreads
    };
  }
  case actions.WATCHER_REQUEST_COMPLETE: {
    const {response, timestamp} = action.payload;
    const watchedThreads = _.mapValues(state.watchedThreads, (data, id) => {
      const responseThread = response.threads[id];
      if (responseThread) {
        // If we've never viewed the thread since watching it, assume we've
        // already seen all of its posts.
        // Only decrease the seen_reply_count value if the latest post seen
        // locally was more than two minutes ago (The server may cache old
        // values for a short amount of time), or if the last reported reply
        // time is more recent than the last seen reply.
        if (
          data.seen_reply_count == null ||
          (data.seen_reply_count > responseThread.reply_count &&
           responseThread.reply_count != null &&
           (data.last_seen_time + 2*60 < timestamp/1000 ||
            data.last_seen_time < responseThread.last_reply_time))
        ) {
          data = {...data, seen_reply_count: responseThread.reply_count};
        }
        if (data.last_seen_time == null) {
          data = {...data, last_seen_time: responseThread.last_reply_time};
        }
        if (data.known_reply_count != responseThread.reply_count) {
          data = {...data, known_reply_count: responseThread.reply_count};
        }
        if (data.last_known_time != responseThread.last_reply_time) {
          data = {...data, last_known_time: responseThread.last_reply_time};
        }
      }
      return data;
    });
    const alerts = countAlerts(watchedThreads, response, state.currentThreadId);
    return {
      ...state,
      watchedThreads,
      alerts,
      lastResponse: response
    };
  }
  case actions.WATCH_THREAD: {
    const {id, data} = action.payload;
    const watchedThreads = {...state.watchedThreads, [id]: data};
    return {
      ...state,
      watchedThreads
    };
  }
  case actions.UNWATCH_THREAD: {
    const {lastResponse, currentThreadId} = state;
    const {id} = action.payload;
    const watchedThreads = {...state.watchedThreads};
    delete watchedThreads[id];
    const alerts = countAlerts(watchedThreads, lastResponse, currentThreadId);
    return {
      ...state,
      watchedThreads,
      alerts,
      lastResponse
    };
  }
  default:
    return state;
  }
}
