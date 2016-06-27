import assert from 'assert';
import {call, put, fork} from 'redux-saga/effects';
import MockWebStorage from 'mock-webstorage';
import delay from '../src/main/lib/delay';

import saga, {refresher, requestWatcher} from '../src/main/react/watcher/saga';
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

  it('works with watched_threads set', function() {
    const watched_threads = {
      'b:651': {
        'subject':'',
        'opname':'moot',
        'optrip':'!Ep8pui8Vw2',
        'seen_reply_count':0,
        'known_reply_count':0,
        'last_seen_time':1461210236,
        'last_known_time':1461210236,
        'post':'a'
      }
    };

    const localStorage = new MockWebStorage();
    localStorage.setItem('watched_threads', JSON.stringify(watched_threads));

    const s = saga(localStorage);
    {
      const {value} = s.next();
      assert.deepEqual(value, put(actions.setWatchedThreads(watched_threads)));
    }
    {
      const {value} = s.next();
      assert.deepEqual(value, fork(refresher));
    }
  });

  it('refresher refreshes thread continually', function() {
    const watched_threads = {'b:651': 'FOOBAR'};
    const s = refresher();
    for (let i=0; i<3; i++) {
      {
        const {value} = s.next();
        assert(value.SELECT);
      }
      {
        const {value} = s.next(watched_threads);
        assert.deepEqual(value, call(requestWatcher, watched_threads));
      }
      {
        const {value} = s.next({'foo': 'bar'});
        assert.deepEqual(value, put(actions.requestComplete({'foo': 'bar'})));
      }
      {
        const {value} = s.next();
        assert.deepEqual(value, call(delay, 30*1000));
      }
    }
  });
});
