/* @flow */

import * as actions from './actions';

const initialState = {
  filterListRequestRunning: false,
  filterListLastError: null,
  filterList: []
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
    return {
      ...state,
      filterListRequestRunning: false,
      filterList
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
