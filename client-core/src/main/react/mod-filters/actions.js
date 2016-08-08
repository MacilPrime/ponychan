/* @flow */

export const FETCH_LIST_REQUEST = 'FETCH_LIST_REQUEST';
export const FETCH_LIST_SUCCESS = 'FETCH_LIST_SUCCESS';
export const FETCH_LIST_FAIL = 'FETCH_LIST_FAIL';
export const FETCH_FILTER_REQUEST = 'FETCH_FILTER_REQUEST';
export const FETCH_FILTER_SUCCESS = 'FETCH_FILTER_SUCCESS';
export const FETCH_FILTER_FAIL = 'FETCH_FILTER_FAIL';

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

export function fetchFilterRequest(id: number) {
  return {
    type: FETCH_FILTER_REQUEST,
    payload: {id}
  };
}

export function fetchFilterSuccess(filter: Object) {
  return {
    type: FETCH_FILTER_SUCCESS,
    payload: {filter}
  };
}

export function fetchFilterFail(id: number, status: number, response: ?Object) {
  return {
    type: FETCH_FILTER_FAIL,
    payload: {id, status, response}
  };
}
