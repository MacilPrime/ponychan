/*
 * show-backlinks.js
 * https://github.com/savetheinternet/Tinyboard/blob/master/js/show-backlinks.js
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   // $config['additional_javascript'][] = 'js/post-hover'; (optional; must come first)
 *   $config['additional_javascript'][] = 'js/show-backlinks.js';
 *
 */

import $ from 'jquery';
import {get_post_num, get_post_board} from '../post-info';

$(document).ready(function(){
	function showBackLinks() {
		if (/post-(inline|preview|hover)/.test(this.className))
			return;
		var reply_id = get_post_num( $(this) );
		const post_board = get_post_board($(this));

		$(this).find('a.bodylink.postlink').each(function() {
			var m = $(this).text().match(/^>>(\d+)/);
			if (!m) return;
			var id = m[1];

			var $post = $('#reply_' + id);
			if($post.length == 0)
				return;

			var $mentioned = $post.find('.intro').first().find('.mentioned').first();
			if($mentioned.length == 0)
				$mentioned = $('<span class="mentioned"></span>').appendTo($post.find('.intro').first());

			if ($mentioned.find('.mentioned-' + reply_id).length != 0)
				return;

			const $link = $('<a />')
				.addClass('postlink backlink mentioned-'+reply_id)
				.attr('href', "#"+reply_id)
				.text('>>'+reply_id)
				.appendTo($mentioned);

			if ($post.attr("data-filtered")) {
				// filtered posts
				$link.css("display", "none");
			}

			if (window.init_postlink_hover)
				$link.each(init_postlink_hover);
		});
	}

	$('div.post.reply').each(showBackLinks);
	$(document).on('new_post', function(e, post) {
		$(post).each(showBackLinks);
	});
});
