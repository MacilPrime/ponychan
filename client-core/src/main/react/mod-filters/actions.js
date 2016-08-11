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

export const FETCH_FILTER_REQUEST = 'FETCH_FILTER_REQUEST';
export const FETCH_FILTER_SUCCESS = 'FETCH_FILTER_SUCCESS';
export const FETCH_FILTER_FAIL = 'FETCH_FILTER_FAIL';

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

export const PREVIEW_FILTER_REQUEST = 'PREVIEW_FILTER_REQUEST';
export const PREVIEW_FILTER_SUCCESS = 'PREVIEW_FILTER_SUCCESS';
export const PREVIEW_FILTER_FAIL = 'PREVIEW_FILTER_FAIL';
export const CLEAR_PREVIEWED_FILTER = 'CLEAR_PREVIEWED_FILTER';

export function previewFilterRequest(conditions: Object[]) {
  return {
    type: PREVIEW_FILTER_REQUEST,
    payload: {conditions}
  };
}

export function previewFilterSuccess(response: Object) {
  return {
    type: PREVIEW_FILTER_SUCCESS,
    payload: {response}
  };
}

export function previewFilterFail(status: number, response: ?Object) {
  return {
    type: PREVIEW_FILTER_FAIL,
    payload: {status, response}
  };
}

export function clearPreviewedFilter() {
  return {type: CLEAR_PREVIEWED_FILTER};
}

export const UPDATE_FILTER_REQUEST = 'UPDATE_FILTER_REQUEST';
export const UPDATE_FILTER_SUCCESS = 'UPDATE_FILTER_SUCCESS';
export const UPDATE_FILTER_FAIL = 'UPDATE_FILTER_FAIL';

export function updateFilterRequest(requestId: string, data: {type:'update', id:number, mode:number}|{type:'create', filter:Object}) {
  return {
    type: UPDATE_FILTER_REQUEST,
    payload: {requestId, data}
  };
}

export function updateFilterSuccess(requestId: string, id: number) {
  return {
    type: UPDATE_FILTER_SUCCESS,
    payload: {requestId, id}
  };
}

export function updateFilterFail(requestId: string, status: number, response: ?Object) {
  return {
    type: UPDATE_FILTER_FAIL,
    payload: {requestId, status, response}
  };
}
