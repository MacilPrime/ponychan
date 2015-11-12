/* @flow */
//jshint ignore:start

import assert from 'assert';
import sinon from 'sinon';
import config from '../src/config';
import modHash from "../src/modHash";

describe("modHash", function() {
  it("works", function() {
    assert.strictEqual('zcMEeFIphylsTZlMVmEe', modHash('admin', 'somehash', 'foo'));
  });

  it("works with a different cookies_salt value", sinon.test(function() {
    this.stub(config.board, 'cookies_salt', 'foo');
    assert.strictEqual('EprJ23XGTWzVJrO1PFdp', modHash('admin', 'somehash', 'foo'));
  }));
});
