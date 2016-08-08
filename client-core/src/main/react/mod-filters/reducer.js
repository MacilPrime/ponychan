/* @flow */

import _ from 'lodash';
import * as actions from './actions';

const initialState = {
  filterListRequestRunning: false,
  filterListLastError: null,
  filtersById: {}
};
export type State = typeof initialState;

export default function reducer(state: State=initialState, action: Object): State {
  switch (action.type) {
  case actions.FETCH_LIST_REQUEST: {
    return {
      ...state,
      filterListRequestRunning: true
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
      filterListRequestRunning: false,
      filtersById
    };
  }
  case actions.FETCH_LIST_FAIL: {
    return {
      ...state,
      filterListRequestRunning: false,
      filterListLastError: action.payload
    };
  }
  default:
    return state;
  }
}
