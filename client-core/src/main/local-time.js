/*
 * local-time.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import moment from 'moment';
import udKefir from 'ud-kefir';
import $ from 'jquery';
import {documentReady, newPosts} from './lib/events';
import settings from './settings';

settings.newSetting('time_casual', 'bool', true, '12 hour time display', 'pagestyle', {orderhint: 4});

const update = udKefir(module, null).changes().take(1).toProperty();

documentReady.takeUntilBy(update).onValue(() => {
  let time_casual, time_format_string;

  function init() {
    time_casual = settings.getSetting('time_casual');

    if (time_casual)
      time_format_string = 'D MMM YYYY h:mm:ss A';
    else
    time_format_string = 'D MMM YYYY HH:mm:ss';

    formatTimeElements(document.body);
  }
  init();

  settings.getSettingStream('time_casual')
    .changes()
    .takeUntilBy(update)
    .onValue(init);

  function formatTimeElements(context) {
    $('time', context).each(function() {
      const $t = $(this);
      $t.text(moment($t.attr('datetime')).format(time_format_string));
    });
  }

  // allow to work with auto-reload.js, etc.
  newPosts
    .takeUntilBy(update)
    .onValue(formatTimeElements);
});
