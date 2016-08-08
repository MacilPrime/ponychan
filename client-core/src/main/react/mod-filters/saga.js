/* @flow */

import * as actions from './actions';
import {takeEvery, takeLatest} from 'redux-saga';
import {call, put, fork} from 'redux-saga/effects';
import errorFromResponse from '../../lib/errorFromResponse';

export async function fetchList(): Promise<Object> {
  const response = await fetch(
    '/api/v1/mod/filters/',
    {credentials: 'same-origin'}
  );
  if (response.ok) {
    return await response.json();
  } else {
    throw await errorFromResponse(response);
  }
}

export async function fetchFilter(id: number): Promise<Object> {
  const response = await fetch(
    `/api/v1/mod/filters/${id}`,
    {credentials: 'same-origin'}
  );
  if (response.ok) {
    return await response.json();
  } else {
    throw await errorFromResponse(response);
  }
}

export function* listRefresher(): any {
  yield* takeLatest(actions.FETCH_LIST_REQUEST, function*() {
    try {
      const response: any = yield call(fetchList);
      const {data} = response;
      yield put(actions.fetchListSuccess(data));
    } catch (err) {
      const {details} = err;
      if (details) {
        yield put(actions.fetchListFail(details.status, details.text));
      } else {
        yield put(actions.fetchListFail(0, null));
      }
    }
  });
}

export function* filterFetcher(): any {
  yield* takeEvery(actions.FETCH_FILTER_REQUEST, function*(action) {
    const {id} = action.payload;
    try {
      const response: any = yield call(fetchFilter, id);
      yield put(actions.fetchFilterSuccess(response));
    } catch (err) {
      const {details} = err;
      if (details) {
        yield put(actions.fetchFilterFail(id, details.status, details.text));
      } else {
        yield put(actions.fetchFilterFail(id, 0, err.message));
      }
    }
  });
}

export default function* root(): any {
  yield [
    fork(listRefresher),
    fork(filterFetcher)
  ];
}
