/*
 * embed.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';

// converts "1m20s" to 80, etc
function convert_time_to_seconds(s) {
	if (/^[0-9]+$/.exec(s))
		return parseInt(s);
	var m = /^(?:([0-9]+)h)?(?:([0-9]+)m)?(?:([0-9]+)s)?$/.exec(s);
	if (!m)
		return null;
	var t = 0;
	if (m[1])
		t += parseInt(m[1])*60*60;
	if (m[2])
		t += parseInt(m[2])*60;
	if (m[3])
		t += parseInt(m[3]);
	return t;
}

$(document).ready(function(){
	function init(context) {
		$(".embedbtnspan", context).remove();
		$("a.bodylink:not(.postlink)", context).each(function() {
			var $link = $(this);
			var href = $link.attr("href");
			var m = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?(?:[^&=]+=[^&]+&)*v=|v\/|embed\/)|youtu\.be\/)([^?&#]+)/.exec(href);
			if (m) {
				var vid = m[1];
				var params = get_url_params(href, true);
				var embedsrc = "https://www.youtube.com/embed/"+vid+"?html5=1&rel=0";
				var start = convert_time_to_seconds(params.t || params.start);
				if (start)
					embedsrc += '&start='+start;
				var end = convert_time_to_seconds(params.end);
				if (end)
					embedsrc += '&end='+end;

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
								.attr("src", embedsrc)
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
