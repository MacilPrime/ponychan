/*
 * inline-expanding.js
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org>
 * Copyright (c) 2012 Alyssa Rowan <alyssa.rowan@gmail.com>
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import settings from '../settings';

settings.newSetting("image_expand_enabled", "bool", true, "Expand image on click", 'links', {orderhint:3});

$(document).ready(function(){
	var image_expand_enabled = settings.getSetting("image_expand_enabled");
	$(document).on("setting_change", function(e, setting) {
		if (setting == "image_expand_enabled")
			image_expand_enabled = settings.getSetting("image_expand_enabled");
	});

	function init_expand_image() {
		var $img = $(this);
		if ($img.attr('data-old-src')) {
			$img
				.attr({src: $img.attr('data-old-src')})
				.removeAttr('data-old-src')
				.removeClass('expanded').removeClass('loading')
				.show();
			$img.next('video').each(function() {
				if (this.pause) {
					this.pause();
				}
				this.removeAttribute("src");
			}).remove();
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
					});
				if ($img.hasClass('video')) {
					$img.hide();
					$('<video/>')
						.addClass('postimg')
						.addClass('expanded')
						.attr({
							src: $a.attr('href'),
							loop: true,
							muted: true,
							autoplay: true
						})
						.click(function(e) {
							e.preventDefault();
							$img.click();
						})
						.insertAfter($img);
				} else {
					$img
						.addClass('expanded')
						.addClass('loading')
						.load(function() {
							$(this).removeClass('loading');
						});
				}
			} else {
				$img
					.attr({src: $img.attr('data-old-src')})
					.removeAttr('data-old-src')
					.removeClass('expanded').removeClass('loading')
					.show();
				$img.next('video').remove();
			}
			e.stopPropagation();
			e.preventDefault();
			return false;
		});
	}

	$('a:not([class="file"]) > img.postimg').each(init_expand_image);
	$(document).on('new_post', function(e, post) {
		$(post).find('> a:not([class="file"]) > img.postimg').each(init_expand_image);
	});
});
