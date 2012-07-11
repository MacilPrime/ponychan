/*
 * auto-reload.js
 * https://github.com/savetheinternet/Tinyboard/blob/master/js/auto-reload.js
 *
 * Brings AJAX to Tinyboard.
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/auto-reload.js';
 *
 */

$(document).ready(function(){
	if($('div.banner').length == 0)
		return; // not index

	var $statusBox = $("<div/>")
		.attr("id", "updateStatus")
		.css("position", "fixed")
		.css("bottom", 0)
		.css("right", 0)
		.appendTo(document.body);

	var $postsAdded = $("<span/>").text("+0");
	var $countDown = $("<span/>");
	$statusBox.append($postsAdded, " ", $countDown);
	
	var updateInterval = 30;
	var retryInterval = 10;

	var tickTimer = null;
	var query = null;
	var timeUntilUpdate = updateInterval+1;

	var tick = function() {
		timeUntilUpdate--;
		if(timeUntilUpdate > 0) {
			$countDown.text("-"+timeUntilUpdate);
			tickTimer = setTimeout(tick, 1000);
		} else {
			downloadNewPosts();
		}
	};
	
	var downloadNewPosts = function() {
		if(tickTimer)
			clearTimeout(tickTimer);

		$countDown.text("-0");

		if(query)
			query.abort();

		query = $.ajax({
			url: document.location,
			success: function(data) {
				var postsAddedCount = 0;
				$(data).find('div.post.reply').each(function() {
					var id = $(this).attr('id');
					if($('#' + id).length == 0) {
						$(this).insertAfter($('div.post:last').next()).after('<br class="clear">');
						$(document).trigger('new_post', this);
						postsAddedCount++;
					}
				});
				$postsAdded.text("+"+postsAddedCount);
				timeUntilUpdate = updateInterval+1;
				tick();
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if(textStatus == "abort")
					return;
				if(textStatus == "error" && errorThrown == "Not Found") {
					$statusBox.css('color', 'red').text('404');
					return;
				}
				$postsAdded.text("Retrying");
				timeUntilUpdate = retryInterval+1;
				tick();
			},
			complete: function() {
				query = null;
			}
		});
	};

	$(document).keydown(function(event) {
		if(/TEXTAREA|INPUT/.test(event.target.nodeName))
			return;

		if(event.which == 85) {
			if(timeUntilUpdate < updateInterval)
				downloadNewPosts();
		}
	});

	tick();
});

