/* @flow */

import assert from 'assert';

import ipToUserRange from '../src/main/lib/ipToUserRange';

describe('ipToUserRange', function() {
  it("doesn't change IPv4 addresses", function() {
    assert.strictEqual(ipToUserRange('1.2.3.4'), '1.2.3.4');
    assert.strictEqual(ipToUserRange('10.20.30.40'), '10.20.30.40');
  });

  it('transforms IPv6 addresses', function() {
    assert.strictEqual(
      ipToUserRange('2601:123:44:abcd:9999:123:44:aaaa'),
      '2601:123:44:abcd:*'
    );
  });
});
