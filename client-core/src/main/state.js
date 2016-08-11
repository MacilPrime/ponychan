/* @flow
 * state.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import {demogrifyEl} from './mogrify';

if (typeof history != 'undefined' && history && history.state) {
  applyState(history.state);
}

export function newState(state: Object, url: ?string) {
  applyState(state);

  if (typeof history != 'undefined' && history && history.pushState) {
    if (url)
      history.pushState(state, document.title, url);
    else
      history.pushState(state, document.title);
  }
}

function applyState(state) {
  $(document).ready(function() {
    if (state && state.hasOwnProperty('banpage')) {
      const $banbody = $($.parseHTML(state.banpage)).filter('.ban');
      $('.ban').remove();
      $(document.body).children().addClass('ban-hidden');
      $(document.body).append($banbody);
      demogrifyEl($banbody);
    } else {
      const $bh = $('.ban-hidden');
      if ($bh.length) {
        $bh.removeClass('ban-hidden');
        $('.ban').remove();
      }
    }
  });
}

$(window).on('popstate', function(event) {
  applyState(event.originalEvent.state);
});
