require('./legacy/visibility.min.js');

import './logger.js';
import './legacy/default.js';
import settings from './settings.js';

require('./state.js');
require('./styles.js');
import './cite-reply';
require('./spoiler-toggle.js');
require('./local-time.js');
require('./legacy/reloader.js');
require('./legacy/post-hover.js');
require('./my-posts.js');
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

import './settings-screen.jsx';

// for debugging and inline scripts
window.mlpchan = {
  _dbg_require: require,
  libs: {
    Bacon: require('baconjs'),
    React: require('react/addons'),
    Immutable: require('immutable'),
    RSVP: require('rsvp'),
    $: require('jquery'),
    _: require('lodash'),
    moment: require('moment')
  },
  settings: settings
};

window.$ = window.mlpchan.$;
window.settings = window.mlpchan.settings;
