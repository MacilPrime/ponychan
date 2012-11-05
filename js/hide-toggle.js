/*
 * hide-toggle.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/hide-toggle.js';
 *   $config['markup'][] = array("/\[h\](.+?)\[\/h\]/s", "<div class=\"hidetext\">\$1</div>");
 *   $config['markup'][] = array("/\[hide\](.+?)\[\/hide\]/s", "<div class=\"hidetext\">\$1</div>");
 *
 */

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
			
			$text.addClass('off');
			$button.text('Show')
			
			$button.on('click.hider', function() {
				if(!$text.hasClass('off')) {
					$text.addClass('off');
					$button.text('Show');
				} else {
					$text.removeClass('off');
					$button.text('Hide');
				}
				return false;
			})
		});
	};

	togglifier(document.body);
	$(document).on('new_post', function(e, post) {
		togglifier(post);
	});
});
