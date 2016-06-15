import {fork} from 'redux-saga/effects';
import watcherSaga from '../watcher/saga';

export default function* root() {
  yield [
    fork(watcherSaga)
  ];
}
