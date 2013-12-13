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

settings.newSetting("reloader", "bool", true, "Enable thread auto-updating", 'reloader', {orderhint:1, moredetails:"New posts in threads will appear as they're made."});
settings.newSetting("reloader_autoscroll", "bool", false, "Scroll page down when new posts are loaded", 'reloader', {orderhint:2, moredetails:"Only happens if page is scrolled to the bottom already."});

var reloader = {
	updateThreadNow: function() {}
};

$(document).ready(function(){
	if($('div.banner').length == 0)
		return; // not index

	var $statusContainer = $("<div/>")
		.css("position", "fixed")
		.css("bottom", 0)
		.css("right", 0)
		.appendTo(document.body);

	var updateEnabled = settings.getSetting("reloader");
	var autoScroll = settings.getSetting("reloader_autoscroll");

	var tickTimer = null;

	var updateInterval = 30;
	if(window.localStorage && localStorage.updateInterval != null)
		updateInterval = parseInt(localStorage.updateInterval);

	var timeUntilUpdate;
	var timeSinceActivity = 0;
	
	// adaptive updating constants
	var multiplierDelay = 2*60*60; // no updateInterval multiplying happens until the thread has been inactive at least this long.
	var maxUpdateInterval = 5*60;
	var multiplier = maxUpdateInterval / (3*60*60); // Takes three hours to get to maxUpdateInterval.

	function prepareDelayedUpdate() {
		if(updateEnabled) {
			timeUntilUpdate = updateInterval;

			if (timeSinceActivity > multiplierDelay)
				timeUntilUpdate = Math.min(maxUpdateInterval, timeUntilUpdate + Math.floor(multiplier*(timeSinceActivity-multiplierDelay)));

 			timeSinceActivity += updateInterval;
			tick();
		}
	}
	
	function saveSettings() {
		if (!window.localStorage) return;
		localStorage.updateInterval = updateInterval;
	}

	var $statusSettings = $("<div/>")
		.attr("id", "updateSettings")
		.css("background-color", "grey")
		.css("text-align", "right")
		.appendTo($statusContainer)
		.hide();
	var $updateCheckboxLabel = $("<label/>")
		.text("Auto-update threads ")
		.appendTo($statusSettings);
	var $updateCheckbox = $("<input/>")
		.attr("id", "updateCheckbox")
		.attr("type", "checkbox")
		.appendTo($updateCheckboxLabel);
	$statusSettings.append("<br/>");
	var $autoScrollCheckboxLabel = $("<label/>")
		.text("Auto-scroll on new posts ")
		.appendTo($statusSettings);
	var $autoScrollCheckbox = $("<input/>")
		.attr("id", "autoScrollCheckbox")
		.attr("type", "checkbox")
		.appendTo($autoScrollCheckboxLabel);
	settings.bindCheckbox($updateCheckbox, "reloader");
	settings.bindCheckbox($autoScrollCheckbox, "reloader_autoscroll");
	$statusSettings.append("<br/>");
	$("<span/>")
		.text("Update interval")
		.appendTo($statusSettings);
	$statusSettings.append(" ");
	var $updateIntervalField = $("<input/>")
		.attr("id", "updateIntervalField")
		.attr("type", "text")
		.css("width", "3em")
		.val(updateInterval)
		.blur(function() {
			var newVal = parseInt($(this).val());
			if(isNaN(newVal) || newVal < 1) {
				alert("Update interval must be a positive number!");
				return;
			}
			updateInterval = newVal;
			timeSinceActivity = 0;
			saveSettings();
		}).appendTo($statusSettings);
	$statusSettings.append("<br/>");
	$("<input/>")
		.attr("type", "button")
		.val("Update Now")
		.click(function() {
			updateThreadNow();
		})
		.appendTo($statusSettings);

	var $statusBox = $("<div/>")
		.attr("id", "updateStatus")
		.appendTo($statusContainer);
	var $postsAdded = $("<span/>").addClass("updatePostsAdded").text("+0");
	var $countDown = $("<span/>").addClass("updateCountDown").text("-");
	$statusBox.append($postsAdded, " ", $countDown);

	$statusContainer.hover(function() {
		$statusSettings.show();
		$statusSettings.prepend($statusBox);
	}, function() {
		$statusContainer.prepend($statusBox);
		$statusSettings.hide();
	});
	
	function loadPosts($data) {
		var postsAddedCount = 0;
		
		var scrolledToBottom = ( $(window).scrollTop() + $(window).height() >= $(document).height() );

		var $lastPostC = $('div.postContainer:not(.post-inline-container):not(.preview-hidden):last');
		var lastPostNum = get_post_num($lastPostC.children('.post').first());
		
		$data.find('div.postContainer.replyContainer').each(function(index) {
			var $postC = $(this);
			var postNum = get_post_num($postC.children('.post').first());
			
			if(postNum > lastPostNum && $('#' + $postC.attr('id')).length == 0) {
				$postC.insertAfter($lastPostC);
				$(document).trigger('new_post', $postC.children('.post')[0]);
				
				$lastPostC = $postC;
				lastPostNum = postNum;
				
				postsAddedCount++;
				timeSinceActivity = 0;
			}
		});
		
		$postsAdded.text("+"+postsAddedCount);
		$countDown.text("-");

		if (autoScroll && postsAddedCount && scrolledToBottom) {
			$(document).scrollTop($(document).height());
		}
	}

	var query = null;
	var page_etag = null;
	function updateThread(nocache) {
		if(query)
			query.abort();

		$postsAdded.text("...");

		var headers = {};
		if (page_etag && document.location.pathname == siteroot+'mod.php') {
			headers['X-CF-Dodge-If-None-Match'] = page_etag;
		}

		query = $.ajax({
			url: document.location,
			headers: headers,
			cache: !nocache,
			success: function(data, status, jqXHR) {
				if (jqXHR.getResponseHeader('Etag'))
					page_etag = jqXHR.getResponseHeader('Etag');
				else if (jqXHR.getResponseHeader('X-CF-Dodge-Etag'))
					page_etag = jqXHR.getResponseHeader('X-CF-Dodge-Etag');
				if (status == 'notmodified') {
					data = '<!doctype html><html><body><div class="banner">dummy</div></body></html>';
				}
				data = mogrifyHTML(data);
				var $data = $($.parseHTML(data));
				var $banner = $data.filter('div.banner').add( $data.find('div.banner') ).first();
				if($banner.length) {
					loadPosts($data);
					prepareDelayedUpdate();
				} else {
					if($data.find("h2").first().text().trim() === "Thread specified does not exist.") {
						$statusBox.css('color', 'red').text('404');
					} else {
						$postsAdded.text('Error');
						prepareDelayedUpdate();
					}
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if(textStatus == "abort")
					return;
				if(textStatus == "error" && errorThrown == "Not Found") {
					$statusBox.css('color', 'red').text('404');
					return;
				}
				if(updateEnabled) {
					$postsAdded.text("Retrying");
					prepareDelayedUpdate();
				} else {
					$postsAdded.text("Failed");
					$countDown.text("-");
				}
			},
			complete: function() {
				query = null;
			}
		});
	}

	function tick(nocache) {
		if(tickTimer) {
			clearTimeout(tickTimer);
			tickTimer = null;
		}

		$countDown.text("-"+timeUntilUpdate);
		if(timeUntilUpdate > 0) {
			timeUntilUpdate--;
			tickTimer = setTimeout(tick, 1000);
		} else {
			updateThread(nocache);
		}
	}

	function updateThreadNow(nocache) {
		timeSinceActivity = 0;
		timeUntilUpdate = 0;
		tick(nocache);
	}
	reloader.updateThreadNow = updateThreadNow;

	$(document).keydown(function(event) {
		if(/TEXTAREA|INPUT/.test(event.target.nodeName))
			return true;

		if(event.which == 85 && !event.ctrlKey && !event.shiftKey) {
			updateThreadNow();
			return false;
		}
	});

	$(document).on("setting_change", function(e, setting) {
		if (setting == "reloader") {
			updateEnabled = settings.getSetting("reloader");
			timeSinceActivity = 0;
			if(updateEnabled) {
				prepareDelayedUpdate();
			} else {
				if(tickTimer)
					clearTimeout(tickTimer);
			}
		} else if (setting == "reloader_autoscroll") {
			autoScroll = settings.getSetting("reloader_autoscroll");
		}
	});

	prepareDelayedUpdate();
});
