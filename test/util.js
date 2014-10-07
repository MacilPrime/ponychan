var assert = require('assert');
var RSVP = require('rsvp');
var util = require('../jsmain/util.js');

describe('util', function() {
  describe('wait', function() {
    it('should work', function() {
      return util.wait(1, 'abc').then(function(result) {
        assert.equal(result, 'abc');
      });
    });
    it('should fail', function() {
      return util.wait(1, '123').then(function(result) {
        assert.notEqual(result, '456');
      });
    });
  });

  describe('timeout', function() {
    it('should work', function() {
      return util.timeout(20, util.wait(1, 'beep')).then(function(result) {
        assert.equal(result, 'beep');
      });
    });
    it('should pass errors', function() {
      return util.timeout(20, RSVP.reject('failtime')).then(function() {
        throw new Error("Should not happen");
      }, function(err) {
        assert.equal(err, 'failtime');
      });
    });
    it('should timeout', function() {
      return util.timeout(1, util.wait(20, 'beep')).then(function() {
        throw new Error("Should not happen");
      }, function(err) {
        assert.equal(err.message, "promise timed out");
      });
    });
  });
});
