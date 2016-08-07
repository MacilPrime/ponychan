/* @flow */

import {fork} from 'redux-saga/effects';
import watcherSaga from '../watcher/saga';

export default function* root(): any {
  yield [
    fork(watcherSaga)
  ];
}
