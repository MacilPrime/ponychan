require('./visibility.min.js');

window.jQuery = window.$ = require('jquery');
window.Q = require('q');

require('./logger.js');
require('./default.js');
require('./notice.js');
require('./settings.js');
require('./state.js');
require('./styles.js');
require('./spoiler-toggle.js');
require('./local-time.js');
require('./reloader.js');
require('./post-hover.js');
require('./postlinkinfo.js');
require('./watcher.js');
require('./notifier.js');
require('./show-filenames.js');
require('./inline-expanding.js');
require('./image-hover.js');
require('./smartphone-spoiler.js');
require('./show-backlinks.js');
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
window._main_require = require;
