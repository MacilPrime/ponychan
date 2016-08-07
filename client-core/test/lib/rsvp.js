/* @flow */
/* eslint-disable no-console */

import RSVP from 'rsvp';

RSVP.on('error', function(err) {
  console.error('Uncaught promise rejection', err);
  process.exit(8);
});

export default RSVP;
