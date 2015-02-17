require('./legacy/visibility.min.js');

require('./logger.js');
require('./legacy/default.js');
import './settings.js';
require('./state.js');
require('./styles.js');
require('./spoiler-toggle.js');
require('./local-time.js');
require('./legacy/reloader.js');
require('./legacy/post-hover.js');
require('./postlinkinfo.js');
require('./watcher.js');
require('./notifier.js');
require('./show-filenames.js');
require('./legacy/inline-expanding.js');
require('./legacy/image-hover.js');
require('./legacy/smartphone-spoiler.js');
require('./legacy/show-backlinks.js');
require('./navbar.js');
require('./permalink.js');
require('./qr.js');
require('./tags.js');
require('./misc.js');
require('./titlebar.js');
require('./hide-toggle.js');
require('./post-hiding.js');
require('./ips.js');
require('./fancy.js');
require('./mc.js');
require('./embed.js');
require('./search.js');
require('./desktop-notifier.js');
require('./hide-trip.js');

// debugging purposes
window._dbg = {
  main_require: require,
  RSVP: require('rsvp'),
  $: require('jquery'),
  _: require('lodash'),
  moment: require('moment')
};
