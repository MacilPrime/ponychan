/* @flow */

import RSVP from 'rsvp';
import cproc from 'child_process';

export default function exec(command: string): Promise<string> {
  return new RSVP.Promise((resolve, reject) => {
    cproc.exec(command, (error, stdout, stderr) => {
      if (stderr) {
        process.stderr.write(stderr);
      }
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}
