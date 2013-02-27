/*
 * inline-expanding.js
 * https://github.com/savetheinternet/Tinyboard/blob/master/js/inline-expanding.js
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org> &
 * Alyssa Rowan <alyssa.rowan@gmail.com>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/inline-expanding.js';
 *
 */

settings.newProp("image_expand_enabled", "bool", true, "Expand image on click", null, 'links', 3);

$(document).ready(function(){
	var image_expand_enabled = settings.getProp("image_expand_enabled");
	$(document).on("setting_change", function(e, setting) {
		if (setting == "image_expand_enabled")
			image_expand_enabled = settings.getProp("image_expand_enabled");
	});

	var init_expand_image = function() {
		var $img = $(this);
		if($img.attr('data-old-src')) {
			$img.attr({
				src: $img.attr('data-old-src'),
				'data-old-src': '',
			}).removeClass('expanded').removeClass('loading');
		}
		$img.click(function(e) {
			if(!image_expand_enabled || e.which == 2 || e.ctrlKey || e.altKey)
				return true;

			var $img = $(this);
			var $a = $img.parent();
			
			if(!$img.attr('data-old-src')) {
				$img
					.attr({
						'data-old-src': $img.attr('src'),
						src: $a.attr('href'),
					})
					.addClass('expanded')
					.addClass('loading')
					.load(function() {
						$(this).removeClass('loading');
					});
			} else {
				$img.attr({
					src: $img.attr('data-old-src'),
					'data-old-src': '',
				}).removeClass('expanded').removeClass('loading');
			}
			e.stopPropagation();
			e.preventDefault();
			return false;
		});
	};
	
	$('div.post>a:not([class="file"])>img').each(init_expand_image);
	$(document).bind('new_post', function(e, post) {
		$(post).find('>a:not([class="file"])>img').each(init_expand_image);
	});
});
