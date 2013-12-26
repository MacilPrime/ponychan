/*
 * embed.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

$(document).ready(function(){
	function init(context) {
		$(".embedbtnspan", context).remove();
		$("a.bodylink:not(.postlink)", context).each(function() {
			var $link = $(this);
			var m = /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?(?:[^&=]+=[^&]+&)*v=|youtu\.be\/)([^?&]+)/.exec($link.attr("href"));
			if (m) {
				var vid = m[1];
				var $embed = null;
				var $embedbtn = $("<a/>")
					.addClass("embedbtn")
					.text("Embed")
					.attr("href", "javascript:;")
					.click(function() {
						if ($embed) {
							$embed.remove();
							$embed = null;
						} else {
							$embed = $('<iframe allowfullscreen></iframe>')
								.addClass("embed")
								.addClass("youtube-embed")
								.attr("width", 420)
								.attr("height", 315)
								.attr("src", "https://www.youtube.com/embed/"+vid+"?html5=1&autoplay=1&rel=0")
								.appendTo($embedbtnspan);
						}
					});
				var $embedbtnspan = $("<span/>")
					.addClass("embedbtnspan")
					.text(" [")
					.append($embedbtn)
					.append("]")
					.insertAfter($link);
			}
		});
	}

	init( $(".thread") );
	$(document).on('new_post.embed', function(e, post) {
		init(post);
	});
});
