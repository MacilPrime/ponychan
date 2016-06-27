import assert from 'assert';
import {call, put} from 'redux-saga/effects';
import MockWebStorage from 'mock-webstorage';

import saga, {requestWatcher} from '../src/main/react/watcher/saga';
import * as actions from '../src/main/react/watcher/actions';

describe('watcher saga', function() {
  it('works with empty localStorage', function() {
    const localStorage = new MockWebStorage();

    const s = saga(localStorage);
    {
      const {value} = s.next();
      assert.deepEqual(value, put(actions.setWatchedThreads({})));
    }
  });
});
