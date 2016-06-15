import _ from 'lodash';
import * as actions from './actions';

const initialState = {
  watchedThreads: {},
  lastResponse: null,
  alerts: 0
};

function countAlerts(watchedThreads, lastResponse) {
  let alerts = 0;

  Object.keys(watchedThreads).forEach(id => {
    const thread = watchedThreads[id];
    if (
      thread.known_reply_count != null &&
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
  case actions.SET_WATCHED_THREADS: {
    const watchedThreads = action.payload;
    const alerts = countAlerts(watchedThreads, null);
    return {
      watchedThreads,
      alerts,
      lastResponse: state.lastResponse
    };
  }
  case actions.WATCHER_REQUEST_COMPLETE: {
    const response = action.payload;
    const watchedThreads = _.mapValues(state.watchedThreads, (data, id) => {
      const responseThread = response.threads[id];
      if (responseThread) {
        return {
          ...data,
          known_reply_count: responseThread.reply_count,
          last_known_time: responseThread.last_reply_time
        };
      } else {
        return data;
      }
    });
    const alerts = countAlerts(watchedThreads, response);
    return {
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
    const {lastResponse} = state;
    const {id} = action.payload;
    const watchedThreads = {...state.watchedThreads};
    delete watchedThreads[id];
    const alerts = countAlerts(watchedThreads, lastResponse);
    return {
      watchedThreads,
      alerts,
      lastResponse
    };
  }
  default:
    return state;
  }
}
