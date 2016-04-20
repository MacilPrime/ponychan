import RSVP from 'rsvp';

export function wait(time, value) {
  return new RSVP.Promise(function(resolve) {
    setTimeout(resolve.bind(null, value), time);
  });
}

export function timeout(time, promise) {
  const flag = {}, err = new Error('promise timed out');
  return RSVP.race([promise, wait(time, flag)]).then(function(result) {
    if (result === flag) {
      throw err;
    } else {
      return result;
    }
  });
}
