/*
 * smartphone-spoiler.js
 * https://github.com/savetheinternet/Tinyboard/blob/master/js/smartphone-spoiler.js
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/smartphone-spoiler.js';
 *
 */

$(document).ready(function(){
	if(navigator.userAgent.match(/iPhone|iPod|iPad|Android|Opera Mini|Blackberry|PlayBook/i)) {
		function init_spoiler_show() {
			$(this).click(function() {
				$(this).css("color", "white");
			});
		};
		$(".spoiler").each(init_spoiler_show);
		$(document).on('new_post', function(e, post) {
			$(post).find(".spoiler").each(init_spoiler_show);
		});
	}
});
