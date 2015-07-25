/*
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
	var togglifier = function(context) {
		$('.hidetext', context).each(function() {
			var $text = $(this);
			var $buttonP;
			var $button;
			if ($text.prev().is('.hidetogglebuttonP')) {
				$buttonP = $text.prev();
				$button = $buttonP.find(".hidetogglebutton");
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
			var __unused = $text[0].offsetHeight;
			$text.css('transition', '');
			$button.text('Show');

			$button.on('click.hider', function() {
				if(!$text.hasClass('off')) {
					$text.addClass('off');
					$button.text('Show');
				} else {
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
