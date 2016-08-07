/* @flow
 * hide-toggle.js
 *
 * Released under the WTFPLv2 license
 *
 * Usage:
 *   $config['markup'][] = array("/\[h\](.+?)\[\/h\]/s", "<div class=\"hidetext\">\$1</div>");
 *   $config['markup'][] = array("/\[hide\](.+?)\[\/hide\]/s", "<div class=\"hidetext\">\$1</div>");
 *
 */

import $ from 'jquery';

$(document).ready(function() {
  let togglifier = function(context) {
    $('.hidetext', context).each(function() {
      const $text = $(this);
      let $buttonP;
      let $button;
      if ($text.prev().is('.hidetogglebuttonP')) {
        $buttonP = $text.prev();
        $button = $buttonP.find('.hidetogglebutton');
      } else {
        $buttonP = $('<span/>')
          .addClass('hidetogglebuttonP')
          .insertBefore($text);
        $button = $('<button/>')
          .addClass('hidetogglebutton')
          .attr('type', 'button')
          .appendTo($buttonP);
      }

      $text.css('transition', 'none');
      $text.addClass('off');
      // see http://stackoverflow.com/a/16575811/1289657
      $text[0].offsetHeight;
      $text.css('transition', '');
      $button.text('Show');

      $button.on('click.hider', function() {
        if (!$text.hasClass('off')) {
        // Allow height to animate from current height to 0 when closing if
        // the stylesheet wants to. Otherwise the height would jump to 0
        // immediately.
          $text.css('height', $text.height());
          $text[0].offsetHeight;
          $text.addClass('off');
          $button.text('Show');
        } else {
          $text.css('height', '');
          $text.removeClass('off');
          $button.text('Hide');
        }
        return false;
      });
    });
  };

  togglifier(document.body);
  $(document).on('new_post', function(e, post) {
    togglifier(post);
  });
});
