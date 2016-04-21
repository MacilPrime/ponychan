/*
 * fancy.js
 * For when you need things to be more fancy and proper.
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/settings.js';
 *   $config['additional_javascript'][] = 'js/fancy.js';
 *
 */

import $ from 'jquery';
import Kefir from 'kefir';
import config from './config';
import settings from './settings';

{
  const revealer = Kefir.pool();
  const hider = revealer.map(()=>false).take(1).toProperty(()=>true);
  settings.newSetting('fancy_mode', 'bool', false, 'Fancy mode', 'pagestyle', {
    orderhint: 20, hider});

  // Unhide if the setting is ever true, or the user does a certain thing.
  revealer.plug(
    Kefir.merge([
      settings.getSettingStream('fancy_mode').filter(Boolean),
      Kefir.fromEvents(document, 'keydown')
        .filter(event =>
          event.which == 70 && !event.ctrlKey && !event.altKey &&
          !event.shiftKey && !event.metaKey
        )
        .filter(event => !/TEXTAREA|INPUT/.test(event.target.nodeName))
        .filter(() => $('.settingsScreen').is(':visible'))
        .map(event => {
          event.preventDefault();
          return event;
        })
    ])
  );
}

$(document).ready(function() {
  let fancy_mode = settings.getSetting('fancy_mode');
  let fancy_pends = [];

  $(document).on('setting_change', function(e, setting) {
    if (setting == 'fancy_mode') {
      fancy_mode = settings.getSetting('fancy_mode');
      cancelFancyPends();
      fancify(document);
    }
  });

  fancify(document);
  $(document).on('new_post', function(e, post) {
    fancify(post);
  });

  function fancify(context) {
    $(context).find('.fancy').remove();
    if (fancy_mode) {
      // grumble grumble there ought to be a better way to do this
      let images;
      if ($(context).is('.post.reply')) {
        images = $(context).find('> a > img.postimg');
      } else {
        images = $(context).find('.post.reply > a > img.postimg');
      }
      images.each(function(i) {
        const $img = $(this);
        function addfancy() {
          const $post = $img.parent().parent();
          const $body = $post.find('> .body').first();
          const hatleft = (($img.outerWidth()-65) * 0.5)-$img.outerWidth()-parseInt($img.css('margin-right'));
          $body.before('<img class="fancy hat" style="position:absolute;margin-top:-22px;margin-left:'+hatleft+'px;padding:0;height:56px;width:65px;" src="'+config.site.siteroot+'static/tophat.png">');
          const monoheight = ($img.outerHeight()-25) * 0.4;
          const monoleft = (($img.outerWidth()-30) * 0.8)-$img.outerWidth()-parseInt($img.css('margin-right'));
          $body.before('<img class="fancy monocle" style="position:absolute;margin-top:'+monoheight+'px;margin-left:'+monoleft+'px;padding:0;height:75px;width:30px;" src="'+config.site.siteroot+'static/monocle.png">');
        }
        if (i == 0) {
          addfancy();
        } else {
          fancy_pends.push(setTimeout(addfancy, i*5));
        }
      });
    }
  }

  function cancelFancyPends() {
    for (let i=0; i<fancy_pends.length; i++) {
      clearTimeout(fancy_pends[i]);
    }
    fancy_pends = [];
  }
});
