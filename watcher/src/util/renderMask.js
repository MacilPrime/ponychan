/* @flow */
//jshint ignore:start

import ip from 'ip';

// TODO move to its own NPM module or a pull request to https://github.com/rs/node-netmask/issues/16
export default function renderMask(range_start: string, range_end: string): string {
  const base = range_start;
  const start = ip.toBuffer(range_start);
  const end = ip.toBuffer(range_end);
  for (let i=0; i<start.length; i++) {
    if (start[i] !== end[i]) {
      for (let j=0; j<8; j++) {
        if (start[i] >> (7 - j) !== end[i] >> (7 - j)) {
          const range = i*8+j;
          return `${base}/${range}`;
        }
      }
    }
  }
  return base;
}
