var RSVP = require('rsvp');

RSVP.on('error', function(err) {
  console.error("Uncaught promise rejection", err);
  process.exit(8);
});

module.exports = RSVP;
