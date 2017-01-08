/*
 * image-hover.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import settings from '../settings';

settings.newSetting("image_hover_enabled", "bool", true, "Expand image on hover", 'links', {orderhint:4});
settings.newSetting("image_spoiler_hover_enabled", "bool", false, "Expand spoiler image on hover", 'links', {orderhint:5});

settings.newSetting('video_with_audio_hover_behavior', 'select', 'nothing', 'Hover behavior on videos with sound', 'links', {
	orderhint: 5.5,
	selectOptions: [
		{value: 'nothing', displayName: 'Do nothing'},
		{value: 'silent-play', displayName: 'Play silently'},
		{value: 'play-with-audio', displayName: 'Play with audio'}
	],
	notSupported: !document.createElement('audio').canPlayType,
	defpriority: 0
});

$(document).ready(() => {
	let image_hover_enabled = settings.getSetting("image_hover_enabled");
	let image_spoiler_hover_enabled = settings.getSetting("image_spoiler_hover_enabled");
	$(document).on("setting_change", function(e, setting) {
		if (setting == "image_hover_enabled")
			image_hover_enabled = settings.getSetting("image_hover_enabled");
		else if (setting == "image_spoiler_hover_enabled")
			image_spoiler_hover_enabled = settings.getSetting("image_spoiler_hover_enabled");
	});

	function init_image_hover() {
		var $image = $(this);
		var hovered_at;
		$image.hover(function(e) {
			const is_spoilered = /\/static\/spoiler\.\w+$/.test($image.attr("src"));
			const imageurl = $image.parent().attr("href");
			if(is_spoilered) {
				if(!image_spoiler_hover_enabled)
					return;
			} else {
				if(!image_hover_enabled)
					return;
			}
			if($image.attr('data-old-src'))
				return;

			hovered_at = {'x': e.pageX, 'y': e.pageY};

			let $newImage;
			const video_with_audio_hover_behavior = settings.getSetting('video_with_audio_hover_behavior');
			if ($image.parent().hasClass('silentvideo')) {
				$newImage = $("<video/>").prop({
					loop: true,
					muted: true,
					autoplay: true
				});
			} else if ($image.parent().hasClass('video')) {
				if (video_with_audio_hover_behavior === 'nothing') {
					return;
				}
				$newImage = $("<video/>").prop({
					loop: true,
					muted: video_with_audio_hover_behavior !== 'play-with-audio',
					autoplay: true
				});
			} else {
				$newImage = $("<img/>");
			}
			$newImage
				.addClass('image-hover')
				.attr('src', imageurl)
				.appendTo(document.body)
				.on('load', function() {
					$(this).trigger('mousemove');
				});
			$image.trigger('mousemove');
		}, function() {
			$('.image-hover').each(function() {
				if (this.pause) {
					this.pause();
				}
				this.removeAttribute("src");
			}).remove();
		}).mousemove(function(e) {
			var $hover = $('.image-hover');
			if($hover.length == 0)
				return;

			var top = (e.pageY ? e.pageY : hovered_at.y) - 10;

			if(e.pageY < $(window).scrollTop() + 15) {
				top = $(window).scrollTop();
			} else if(e.pageY > $(window).scrollTop() + $(window).height() - $hover.height() - 30) {
				top = $(window).scrollTop() + $(window).height() - $hover.height() - 30;
			}

			$hover.css('left', (e.pageX ? e.pageX : hovered_at.x) + 20).css('top', top);
		}).click(function() {
			$image.trigger('mouseleave');
		});
	}

	$('a:not(.file) > img.postimg').each(init_image_hover);
	$(document).on('new_post', function(e, post) {
		$(post).find('a:not(.file) > img.postimg').each(init_image_hover);
	});
});
