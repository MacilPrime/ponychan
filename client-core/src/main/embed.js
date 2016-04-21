/*
 * embed.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import getUrlParams from './lib/getUrlParams';

// converts "1m20s" to 80, etc
function convert_time_to_seconds(s) {
  if (/^[0-9]+$/.exec(s))
    return parseInt(s);
  const m = /^(?:([0-9]+)h)?(?:([0-9]+)m)?(?:([0-9]+)s)?$/.exec(s);
  if (!m)
    return null;
  let t = 0;
  if (m[1])
    t += parseInt(m[1])*60*60;
  if (m[2])
    t += parseInt(m[2])*60;
  if (m[3])
    t += parseInt(m[3]);
  return t;
}

$(document).ready(() => {
  function init(context) {
    $('.embedbtnspan', context).remove();
    $('a.bodylink:not(.postlink)', context).each(function() {
      const $link = $(this);
      const href = $link.attr('href');
      const m = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?(?:[^&=]+=[^&]+&)*v=|v\/|embed\/)|youtu\.be\/)([^?&#]+)/.exec(href);
      if (m) {
        const vid = m[1];
        const params = getUrlParams(href, true);
        let embedsrc = 'https://www.youtube.com/embed/'+vid+'?html5=1&rel=0';
        const start = convert_time_to_seconds(params.t || params.start);
        if (start)
          embedsrc += '&start='+start;
        const end = convert_time_to_seconds(params.end);
        if (end)
          embedsrc += '&end='+end;

        let $embed = null;
        const $embedbtn = $('<a/>')
          .addClass('embedbtn')
          .text('Embed')
          .attr('href', href)
          .click(event => {
            event.preventDefault();
            if ($embed) {
              $embed.remove();
              $embed = null;
            } else {
              $embed = $('<iframe allowfullscreen></iframe>')
                .addClass('embed')
                .addClass('youtube-embed')
                .attr('width', 420)
                .attr('height', 315)
                .attr('src', embedsrc)
                .appendTo($embedbtnspan);
            }
          });
        const $embedbtnspan = $('<span/>')
          .addClass('embedbtnspan')
          .text(' [')
          .append($embedbtn)
          .append(']')
          .insertAfter($link);
      }
    });
  }

  init(document.body);
  $(document).on('new_post.embed', function(e, post) {
    init(post);
  });
});
