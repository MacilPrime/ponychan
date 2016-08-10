/* @flow */

import * as actions from './actions';
import {takeEvery, takeLatest} from 'redux-saga';
import {call, put, fork} from 'redux-saga/effects';
import delay from '../../lib/delay';
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

export async function fetchPreviewStart(conditions: Object[]): Promise<{taskUrl: string}> {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  const response = await fetch(
    '/api/v1/mod/filters/previews/',
    {
      credentials: 'same-origin',
      method: 'POST',
      headers,
      body: JSON.stringify({
        conditions
      })
    }
  );
  if (response.status === 202) {
    const taskUrl = response.headers.get('Location');
    return {taskUrl};
  } else {
    throw await errorFromResponse(response);
  }
}

export async function fetchTaskStatus(taskUrl: string): Promise<{taskResults: ?Object}> {
  const response = await fetch(
    taskUrl,
    {credentials: 'same-origin'}
  );
  if (response.ok) {
    if (response.url.endsWith(taskUrl)) {
      return {taskResults: null};
    } else {
      return {taskResults: await response.json()};
    }
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

export function* previewFetcher(): any {
  yield* takeLatest([
    actions.PREVIEW_FILTER_REQUEST, actions.CLEAR_PREVIEWED_FILTER
  ], function*(action) {
    if (action.type === actions.PREVIEW_FILTER_REQUEST) {
      const {conditions} = action.payload;
      try {
        const response: any = yield call(fetchPreviewStart, conditions);
        const {taskUrl} = response;
        let taskResults = null;
        while (!taskResults) {
          yield call(delay, 1*1000);
          const taskStatusResponse: any = yield call(fetchTaskStatus, taskUrl);
          taskResults = taskStatusResponse.taskResults;
        }
        yield put(actions.previewFilterSuccess(taskResults));
      } catch (err) {
        const {details} = err;
        if (details) {
          yield put(actions.previewFilterFail(details.status, details.text));
        } else {
          yield put(actions.previewFilterFail(0, err.message));
        }
      }
    }
  });
}

export default function* root(): any {
  yield [
    fork(listRefresher),
    fork(filterFetcher),
    fork(previewFetcher),
  ];
}
