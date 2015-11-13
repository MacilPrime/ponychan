/* @flow */
//jshint ignore:start

import assert from 'assert';
import sinon from 'sinon';
import setUserhash from '../src/setUserhash';

describe("setUserhash", function() {
  it("works on valid userid", function() {
    const req: Object = {
      cookies: {
        userid: "492317fe61fbf6773a2ea7b0dc8e25f5"
      }
    };
    const next = sinon.spy();
    setUserhash(req, {}, next);
    assert(next.calledOnce);
    assert.strictEqual(0, next.args[0].length);
    assert.strictEqual(req.userhash, 'ad34055dff30eb3095be75e1db6381d4255728e8');
  });

  it("ignores invalid userid", function() {
    const req: Object = {
      cookies: {
        userid: "492317fe61fbf6773a2ea7b0dc8e25f5f" // extra character
      }
    };
    const next = sinon.spy();
    setUserhash(req, {}, next);
    assert(next.calledOnce);
    assert.strictEqual(0, next.args[0].length);
    assert.strictEqual(req.userhash, null);
  });

  it("ignores request without userid", function() {
    const req: Object = {
      cookies: {
      }
    };
    const next = sinon.spy();
    setUserhash(req, {}, next);
    assert(next.calledOnce);
    assert.strictEqual(0, next.args[0].length);
    assert.strictEqual(req.userhash, null);
  });
});
