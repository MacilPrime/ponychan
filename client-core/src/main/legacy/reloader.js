/*
 * auto-reload.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import kefirBus from 'kefir-bus';
import settings from '../settings';
import {get_post_num} from '../post-info';

settings.newSetting("reloader", "bool", true, "Enable thread auto-updating", 'reloader', {orderhint:1, moredetails:"New posts in threads will appear as they're made."});
settings.newSetting("reloader_autoscroll", "bool", false, "Scroll page down when new posts are loaded", 'reloader', {orderhint:2, moredetails:"Only happens if page is scrolled to the bottom already."});
settings.newSetting("reloader_time", "number", 30, "Update interval in seconds", 'reloader', {
	orderhint:3,
	validator(value) {
		if(value < 1) {
			throw new Error("Update interval must be a positive number!");
		}
	}
});

const updateNoCache = kefirBus();

export function updateThreadNow(nocache=false) {
	updateNoCache.emit(nocache);
}

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

	var isScrolling = false;

	var tickTimer = null;

	var updateInterval = settings.getSetting("reloader_time");

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

	var $statusSettings = $("<div/>")
		.attr("id", "updateSettings")
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
		.val(updateInterval)
		.blur(function() {
			const newVal = parseInt($(this).val());
			settings.setSetting('reloader_time', newVal, true);
			$(this).val(updateInterval);
		}).appendTo($statusSettings);
	$statusSettings.append("<br/>");
	$("<input/>")
		.attr("type", "button")
		.val("Update Now")
		.click(() => {
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

		var scrolledToBottom = isScrolling || ( $(window).scrollTop() + $(window).height() >= $(document).height() );

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
			if (!Visibility.hidden()) {
				isScrolling = true;
				$('html, body').stop().animate({
					scrollTop: $(document).height()-$(window).height()
				}, 1000, function() {
					isScrolling = false;
				});
			} else {
				isScrolling = false;
				$(document).scrollTop($(document).height()-$(window).height());
			}
		}
	}

	var query = null;
	var page_etag = null;
	function updateThread(nocache) {
		if(query)
			query.abort();

		$postsAdded.text("...");

		var headers = {};
		if (page_etag && document.location.pathname == SITE_DATA.siteroot+'mod.php') {
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

	updateNoCache.onValue(nocache => {
		timeSinceActivity = 0;
		timeUntilUpdate = 0;
		tick(nocache);
	});

	$(document).keydown(function(event) {
		if(/TEXTAREA|INPUT/.test(event.target.nodeName))
			return true;

		if(event.which == 85 && !event.ctrlKey && !event.shiftKey) {
			updateThreadNow();
			return false;
		}
	});

	function reinit() {
		timeSinceActivity = 0;
		if(updateEnabled) {
			prepareDelayedUpdate();
		} else {
			if(tickTimer)
				clearTimeout(tickTimer);
		}
	}

	settings.getSettingStream("reloader").changes().onValue(value => {
		updateEnabled = value;
		reinit();
	});
	settings.getSettingStream("reloader_time").changes().onValue(value => {
		updateInterval = value;
		reinit();
	});
	settings.getSettingStream("reloader_autoscroll").onValue(value => {
		autoScroll = value;
	});

	prepareDelayedUpdate();
});
