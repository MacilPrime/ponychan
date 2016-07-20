import RSVP from 'rsvp';

export default function delay(time, value) {
  return new RSVP.Promise(function(resolve) {
    setTimeout(() => {
      resolve(value);
    }, time);
  });
}
