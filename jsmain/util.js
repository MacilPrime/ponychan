var RSVP = require('rsvp');

function wait(time, value) {
  return new RSVP.Promise(function(resolve, reject) {
    setTimeout(resolve.bind(null, value), time);
  });
}
exports.wait = wait;

function timeout(time, promise) {
  var flag = {}, err = new Error("promise timed out");
  return RSVP.race([promise, wait(time, flag)]).then(function(result) {
    if (result === flag) {
      throw err;
    } else {
      return result;
    }
  });
}
exports.timeout = timeout;
