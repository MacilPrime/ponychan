/* @flow */

import _ from 'lodash';
import * as actions from './actions';

export type FetchError = {
  status: number;
  response: ?string;
};

const initialState = {
  fetchListRequestRunning: false,
  fetchListLastError: (null: ?FetchError),

  fetchFilterRequestsRunning: ([]: Array<number>),
  fetchFilterLastErrors: ({}: {[id:number]: FetchError}),

  filtersById: {},

  previewFilterRequestRunning: false,
  previewFilterResponse: null,
  previewFilterLastError: (null: ?FetchError),

  updateRequestsRunning: ([]: Array<string>),
  updateRequestsResponses: ({}: {[requestId:string]: Object}),
  updateRequestsErrors: ({}: {[requestId:string]: FetchError}),
};
export type State = typeof initialState;

export default function reducer(state: State=initialState, action: Object): State {
  switch (action.type) {
  case actions.FETCH_LIST_REQUEST: {
    return {
      ...state,
      fetchListRequestRunning: true,
      fetchListLastError: null
    };
  }
  case actions.FETCH_LIST_SUCCESS: {
    const {filterList} = action.payload;
    const filtersById = _.chain(filterList)
      .map(filter => [filter.id, filter])
      .fromPairs()
      .value();
    return {
      ...state,
      fetchListRequestRunning: false,
      filtersById
    };
  }
  case actions.FETCH_LIST_FAIL: {
    return {
      ...state,
      fetchListRequestRunning: false,
      fetchListLastError: action.payload
    };
  }

  case actions.FETCH_FILTER_REQUEST: {
    const {id} = action.payload;
    return {
      ...state,
      fetchFilterRequestsRunning:
        state.fetchFilterRequestsRunning.filter(x => x !== id).concat([id]),
      fetchFilterLastErrors: _.chain(state.fetchFilterLastErrors)
        .toPairs()
        .filter(([x]) => x !== id)
        .fromPairs()
        .value()
    };
  }
  case actions.FETCH_FILTER_SUCCESS: {
    const {filter} = action.payload;
    return {
      ...state,
      fetchFilterRequestsRunning:
        state.fetchFilterRequestsRunning.filter(x => x !== filter.id),
      filtersById: {...state.filtersById, [filter.id]: filter}
    };
  }
  case actions.FETCH_FILTER_FAIL: {
    const {id, status, response} = action.payload;
    return {
      ...state,
      fetchFilterRequestsRunning:
        state.fetchFilterRequestsRunning.filter(x => x !== id),
      fetchFilterLastErrors: {
        ...state.fetchFilterLastErrors,
        [id]: {status, response}
      }
    };
  }

  case actions.PREVIEW_FILTER_REQUEST: {
    return {
      ...state,
      previewFilterRequestRunning: true,
      previewFilterLastError: null,
      previewFilterResponse: null
    };
  }
  case actions.PREVIEW_FILTER_SUCCESS: {
    const {response} = action.payload;
    return {
      ...state,
      previewFilterRequestRunning: false,
      previewFilterResponse: response
    };
  }
  case actions.PREVIEW_FILTER_FAIL: {
    return {
      ...state,
      previewFilterRequestRunning: false,
      previewFilterLastError: action.payload
    };
  }
  case actions.CLEAR_PREVIEWED_FILTER: {
    return {
      ...state,
      previewFilterRequestRunning: false,
      previewFilterLastError: null,
      previewFilterResponse: null
    };
  }

  case actions.UPDATE_FILTER_REQUEST: {
    const {requestId} = action.payload;
    return {
      ...state,
      updateRequestsRunning: [requestId],
      updateRequestsErrors: {}
    };
  }
  case actions.UPDATE_FILTER_SUCCESS: {
    const {requestId, id} = action.payload;
    return {
      ...state,
      updateRequestsRunning: [],
      updateRequestsResponses: {[requestId]: {id}}
    };
  }
  case actions.UPDATE_FILTER_FAIL: {
    const {requestId, status, response} = action.payload;
    return {
      ...state,
      updateRequestsRunning: [],
      updateRequestsErrors: {[requestId]: {status, response}}
    };
  }

  default:
    return state;
  }
}
