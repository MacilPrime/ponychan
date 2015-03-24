var RSVP = require('rsvp');
var cproc = require('child_process');

module.exports = function exec(command) {
  return new RSVP.Promise(function(resolve, reject) {
    cproc.exec(command, function(error, stdout, stderr) {
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
};
