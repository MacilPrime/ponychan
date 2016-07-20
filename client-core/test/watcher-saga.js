import assert from 'assert';
import {call, put, take, cancel, fork} from 'redux-saga/effects';
import {createMockTask} from 'redux-saga/utils';
import MockWebStorage from 'mock-webstorage';
import delay from '../src/main/lib/delay';

import saga, {saver, refresher, requestWatcher} from '../src/main/react/watcher/saga';
import * as actions from '../src/main/react/watcher/actions';

describe('watcher saga', function() {
  it('works with empty localStorage', function() {
    const localStorage = new MockWebStorage();

    const s = saga(localStorage);
    let value = s.next().value;
    assert(value.SELECT);
    value = s.next({}).value;
    assert.deepEqual(value, fork(saver, localStorage));
    value = s.next().value;
    assert.deepEqual(value, fork(refresher, localStorage));
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
    let value = s.next().value;
    assert(value.SELECT);
    value = s.next({}).value;
    assert.deepEqual(value, put(actions.setWatchedThreads(watched_threads)));
    value = s.next().value;
    assert.deepEqual(value, fork(saver, localStorage));
    value = s.next().value;
    assert.deepEqual(value, fork(refresher, localStorage));
    const task1 = createMockTask();
    value = s.next(task1).value;
    assert.deepEqual(value, take([actions.SET_WATCHED_THREADS, actions.WATCH_THREAD]));
    value = s.next().value;
    assert.deepEqual(value, cancel(task1));
    value = s.next().value;
    assert.deepEqual(value, fork(refresher, localStorage));
    const task2 = createMockTask();
    value = s.next(task2).value;
    assert.deepEqual(value, take([actions.SET_WATCHED_THREADS, actions.WATCH_THREAD]));
    value = s.next().value;
    assert.deepEqual(value, cancel(task2));
    value = s.next().value;
    assert.deepEqual(value, fork(refresher, localStorage));
  });

  it('refresher does nothing if given no threads', function() {
    const s = refresher();

    let value = s.next().value;
    assert(value.SELECT);
    value = s.next(false).value;
    assert(value.SELECT);
    const {done} = s.next({});
    assert(done);
  });

  it('refresher refreshes thread continually', function() {
    let watched_threads = {'b:651': 'FOOBAR'};
    const localStorage = new MockWebStorage();
    localStorage.setItem('watched_threads', JSON.stringify(watched_threads));
    const s = refresher(localStorage);
    let value;
    for (let i=0; i<3; i++) {
      value = s.next().value;
      assert(value.SELECT);
      value = s.next(false).value;
      assert(value.SELECT);
      value = s.next(watched_threads).value;
      assert.deepEqual(value, call(requestWatcher, watched_threads));
      value = s.next({'foo': 'bar'}).value;
      assert.deepEqual(value, put(actions.requestComplete({'foo': 'bar'})));
      if (i == 1) {
        watched_threads = {...watched_threads, 'c:1': 'blah'};
      }
      value = s.next().value;
      assert(value.SELECT);
      value = s.next(watched_threads).value;
      if (i == 1) {
        assert(value.SELECT);
        value = s.next(watched_threads).value;
        assert.deepEqual(
          JSON.parse(localStorage.getItem('watched_threads')),
          watched_threads
        );
      }
      assert.deepEqual(value, call(delay, 30*1000));
    }
  });

  it('saves when user watches or unwatches thread', function() {
    let watched_threads = {'b:651': 'FOOBAR'};
    const localStorage = new MockWebStorage();
    localStorage.setItem('watched_threads', JSON.stringify(watched_threads));
    const s = saver(localStorage);

    let value = s.next().value;
    for (let i=0; i<3; i++) {
      assert.deepEqual(value, take([actions.WATCH_THREAD, actions.UNWATCH_THREAD]));
      value = s.next(false).value;
      assert(value.SELECT);
      watched_threads = {...watched_threads, [`b:${i}`]: `blah ${i}`};
      value = s.next(watched_threads).value;
      assert.deepEqual(
        JSON.parse(localStorage.getItem('watched_threads')),
        watched_threads
      );
    }
  });
});
