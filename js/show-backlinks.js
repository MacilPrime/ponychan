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

$(document).ready(function(){
	function showBackLinks() {
		var reply_id = get_post_num( $(this) );
		
		if ($(this).hasClass('post-inline') || $(this).hasClass('post-hover'))
			return;
		
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
			
			if ($mentioned.find('a.mentioned-' + reply_id).length != 0)
				return;
			
			var $link = $('<a class="postlink backlink mentioned-' + reply_id + '" onclick="highlightReply(\'' + reply_id + '\');" href="#' + reply_id + '">&gt;&gt;' +
				reply_id + '</a>');
			$mentioned.append(" ", $link);
			
			if (window.init_postlink_hover)
				$link.each(init_postlink_hover);
		});
	}
	
	$('div.post.reply').each(showBackLinks);
	$(document).on('new_post', function(e, post) {
		$(post).each(showBackLinks);
	});
});

