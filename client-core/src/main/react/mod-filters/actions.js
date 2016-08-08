/* @flow */

export const FETCH_LIST_REQUEST = 'FETCH_LIST_REQUEST';
export const FETCH_LIST_SUCCESS = 'FETCH_LIST_SUCCESS';
export const FETCH_LIST_FAIL = 'FETCH_LIST_FAIL';

export function fetchListRequest() {
  return {type: FETCH_LIST_REQUEST};
}

export function fetchListSuccess(filterList: Object[]) {
  return {
    type: FETCH_LIST_SUCCESS,
    payload: {filterList}
  };
}

export function fetchListFail(status: number, response: ?Object) {
  return {
    type: FETCH_LIST_FAIL,
    payload: {status, response}
  };
}
