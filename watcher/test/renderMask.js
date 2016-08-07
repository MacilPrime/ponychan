/* @flow */
//jshint ignore:start

import assert from 'assert';
import renderMask from '../src/util/renderMask';

describe('renderMask', function() {
  it('IPv4 single', function() {
    assert.strictEqual(renderMask('1.2.3.4', '1.2.3.4'), '1.2.3.4');
  });

  it('IPv4 range', function() {
    assert.strictEqual(renderMask('172.27.0.0', '172.27.0.255'), '172.27.0.0/24');
  });

  it('IPv6 single', function() {
    assert.strictEqual(
      renderMask('2601:646:102:3e24:28bc:7c77:a437:8c62', '2601:646:102:3e24:28bc:7c77:a437:8c62'),
      '2601:646:102:3e24:28bc:7c77:a437:8c62');
  });

  it('IPv6 range', function() {
    assert.strictEqual(
      renderMask('2601:646:101:af03::', '2601:646:101:af03:ffff:ffff:ffff:ffff'),
      '2601:646:101:af03::/64');
  });
});
