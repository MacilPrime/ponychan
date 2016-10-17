/* @flow */

import ipToUserRange from './ipToUserRange';

test("doesn't change IPv4 addresses", () => {
  expect(ipToUserRange('1.2.3.4')).toBe('1.2.3.4');
  expect(ipToUserRange('10.20.30.40')).toBe('10.20.30.40');
});

test('transforms IPv6 addresses', () => {
  expect(
    ipToUserRange('2601:123:44:abcd:9999:123:44:aaaa')
  ).toBe('2601:123:44:abcd:*');
});
