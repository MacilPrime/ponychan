/* @flow
 * ips.js
 *
 * Released under the WTFPLv2 license
 *
 */

import $ from 'jquery';
import settings from './settings';

settings.newSetting('mod_obscure_ips', 'bool', true, 'Obscure user IP addresses', 'mod', {orderhint:1});

$(document).ready(function() {
  if (document.location.href.match(/\/mod\.php\?\/IP\//)) {
    return;
  }

  let obscure_ips = settings.getSetting('mod_obscure_ips');

  function processIPs(context) {
    if (obscure_ips) {
      $('.posterip a', context)
        .each(function() {
          const $this = $(this);
          if (!$this.attr('data-old-text'))
            $this.attr('data-old-text', $this.text());
        }).text('IP')
        .addClass('ip-hidden')
        .on('mouseenter.iphider', function() {
          const $this = $(this);
          $this.text($this.attr('data-old-text'));
        })
        .on('mouseleave.iphider', function() {
          $(this).text('IP');
        });
    } else {
      $('a.ip-hidden', context).each(function() {
        const $this = $(this);
        $this
          .text($this.attr('data-old-text'))
          .removeClass('ip-hidden')
          .off('.iphider');
      });
    }
  }

  processIPs(document);

  $(document).on('setting_change', function(e, setting) {
    if (setting === 'mod_obscure_ips') {
      obscure_ips = settings.getSetting('mod_obscure_ips');
      processIPs(document);
    }
  });

  $(document).on('new_post', function(e, post) {
    processIPs(post);
  });
});
