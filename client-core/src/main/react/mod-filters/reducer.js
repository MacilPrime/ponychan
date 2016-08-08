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
  filtersById: {}
};
export type State = typeof initialState;

export default function reducer(state: State=initialState, action: Object): State {
  switch (action.type) {
  case actions.FETCH_LIST_REQUEST: {
    return {
      ...state,
      fetchListRequestRunning: true
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
        state.fetchFilterRequestsRunning.filter(x => x !== id).concat([id])
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
  default:
    return state;
  }
}
