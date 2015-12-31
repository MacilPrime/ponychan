/* @flow */

import assert from 'assert';
import isUuid from '../src/util/isUuid';

describe('isUuid', function() {
  it('works', function() {
    assert(isUuid('ee8ee59f-c915-404b-bef0-fedfde3dc014'));
  });

  it('fails', function() {
    assert(!isUuid('Xee8ee59f-c915-404b-bef0-fedfde3dc014'));
  });
});
