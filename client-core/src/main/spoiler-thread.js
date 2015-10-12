import $ from 'jquery';
import Kefir from 'kefir';
import {documentReady, newPosts} from './lib/events';
import settings from './settings';

settings.newSetting("reveal_spoiler_threads", "bool", false, "Always reveal spoiler threads", 'pagestyle',
  {orderhint: 2.5});

const SPOILER_IMAGE = SITE_DATA.siteroot+'static/spoiler.png';

documentReady.onValue(() => {
  if ($('div.banner').length) return;

  function process(reveal_spoiler_threads, $threads) {
    // Clean up any existing spoiler controls. These can exist if this function
    // is re-run on a context, or if this is a saved page.
    $threads.each(function() {
      const $thread = $(this);
      const $op = $thread.find('.post.op');
      if ($thread.hasClass('spoileredThread')) {
        $op.find('img.postimg[data-spoiled-src]').each(function() {
          const $img = $(this);
          $img.attr({
            src: $img.attr('data-spoiled-src')
          }).css({
            width: $img.attr('data-spoiled-width'),
            height: $img.attr('data-spoiled-height')
          }).removeAttr('data-spoiled-src')
          .removeAttr('data-spoiled-width')
          .removeAttr('data-spoiled-height');
        });
        $thread.find('.spoileredThreadControls').remove();
        $thread.removeClass('spoileredThread');
      }

      if (!reveal_spoiler_threads) {
        const isSpoilered = $op.find('.hashtag').filter(function() {
          return $(this).text().toLowerCase() === '#spoiler';
        }).length > 0;
        if (isSpoilered) {
          $thread.addClass('spoileredThread');
          const $img = $op.find('img.postimg');
          if ($img.length) {
            $img.attr({
              "data-spoiled-width": $img.css('width'),
              "data-spoiled-height": $img.css('height'),
              "data-spoiled-src": $img.attr('src'),
              src: SPOILER_IMAGE
            }).css({
              width: '', height: ''
            });
          }
          $('<div/>')
            .addClass('body')
            .addClass('spoileredThreadControls')
            .text('This thread is spoilered due to unreleased content.')
            .append(
              '<br/>',
              $('<button/>')
                .addClass('revealer')
                .attr('type', 'button')
                .text('Reveal')
                .click(function(e) {
                  process(true, $thread);
                })
            )
            .insertAfter($op.find('.body').first());
        }
      }
    });
  }

  settings.getSettingStream('reveal_spoiler_threads')
    .onValue(reveal_spoiler_threads => {
      process(reveal_spoiler_threads, $('.thread'));
    });

  Kefir.combine(
      [newPosts],
      [settings.getSettingStream('reveal_spoiler_threads')]
    )
    .onValue(([post, reveal_spoiler_threads]) => {
      if ($(post).hasClass('op')) {
        process(reveal_spoiler_threads, $(post).parents('.thread').first());
      }
    });
});
