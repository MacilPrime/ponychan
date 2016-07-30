/*
 * notice.js
 *
 * Released under the MIT license
 * Copyright (c) 2014 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import RSVP from 'rsvp';
import Kefir from 'kefir';

export function settingsAd(text, time) {
  return pop(text+' \u2191', time);
}

export function pop(text, time = 30) {
  const bubbleSpacing = 5;
  const $pop = $('<div />')
    .hide()
    .text(text)
    .fadeIn('fast')
    .addClass('popnotice')
    .css('top', () =>
      // calculate navbar height + all existing bubble heights.
      $('.boardlist.top')
        .first()
        .height()
      + $('.popnotice')
        .map((i, el) => $(el).outerHeight()).get()
        .reduce((a, b) => a + b + bubbleSpacing, 0)
    )
    .appendTo(document.body);

  return new RSVP.Promise(resolve => {
    // convert seconds to milliseconds.
    const seconds = s => s * 1000;

    Kefir.merge([
      Kefir.fromEvents($pop, 'click'),
      Kefir.later(seconds(time))
    ])
      .take(1)
      .onValue(() => $pop.fadeOut(seconds(1), resolve));
  }).then(() => {
    $pop.nextAll('.popnotice')
      .each((i, el) =>
        // All bubbles stacked under the removed bubble
        // have to take its place.
        $(el).css({
          top: parseInt($(el)
            .css('top')
            .match(/^\d+/)
            .pop()) - $pop.outerHeight() - bubbleSpacing
        }
      ));
    $pop.remove();
  });
}
