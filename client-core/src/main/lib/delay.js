/* @flow */

import RSVP from 'rsvp';

export default function delay<T>(time: number, value: T): Promise<T> {
  return new RSVP.Promise(function(resolve) {
    setTimeout(() => {
      resolve(value);
    }, time);
  });
}
