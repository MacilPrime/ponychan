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
			var $buttonP = $('<p/>')
				.css('clear', 'both')
				.insertBefore($text);
			var $button = $('<button/>')
				.addClass('hidetogglebutton')
				.text('Show')
				.attr('type', 'button')
				.css('clear', 'both')
				.appendTo($buttonP);
			$text.hide();
			$button.on('click.hider', function() {
				if($text.is(':visible')) {
					$text.hide();
					$button.text('Show');
				} else {
					$text.show();
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
