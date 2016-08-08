/* @flow */

import {fork} from 'redux-saga/effects';
import watcherSaga from '../watcher/saga';
import modFiltersSaga from '../mod-filters/saga';

export default function* root(): any {
  yield [
    fork(watcherSaga),
    fork(modFiltersSaga)
  ];
}
