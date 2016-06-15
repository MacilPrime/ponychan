import assert from 'assert';
import RSVP from './lib/rsvp';
import delay from '../src/main/lib/delay';

describe('delay', function() {
  it('should work', function() {
    return delay(1, 'abc').then(result => {
      assert.equal(result, 'abc');
    });
  });
  it('should fail', function() {
    return delay(1, '123').then(result => {
      assert.notEqual(result, '456');
    });
  });
  it('should pass errors', function() {
    return delay(1, RSVP.reject('failtime')).then(() => {
      throw new Error('Should not happen');
    }, err => {
      assert.equal(err, 'failtime');
    });
  });
});
