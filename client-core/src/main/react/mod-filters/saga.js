/* @flow */

import * as actions from './actions';
import {takeLatest} from 'redux-saga';
import {call, put, fork} from 'redux-saga/effects';

export async function fetchList(): Promise<any> {
  const response = await fetch(
    '/api/v1/mod/filters/',
    {credentials: 'same-origin'}
  );
  if (response.ok) {
    return await response.json();
  } else {
    const error = new Error(response.statusText);
    (error:any).details = {
      status: response.status,
      statusText: response.statusText,
      text: await response.text()
    };
    throw error;
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

export default function* root(): any {
  yield fork(listRefresher);
}
