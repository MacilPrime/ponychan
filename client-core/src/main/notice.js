/*
 * notice.js
 *
 * Released under the MIT license
 * Copyright (c) 2014 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';

export function settingsAd(text, time, cb) {
	return pop(text+' \u2191', time, cb);
}

export function pop(text, time, cb) {
	if (time === undefined) time = 30;

	var $navbar = $(".boardlist.top").first();
	var $notice = $("<div/>")
		.appendTo(document.body)
		.hide()
		.addClass("popnotice")
		.text(text)
		.css("top", $navbar.height()+"px");

	var hasFaded = false;
	var hasCalled = false;

	function fadeNow() {
		if (hasFaded)
			return;
		hasFaded = true;
		$notice.fadeOut(function() {
			$notice.remove();
		});
		if (cb)
			doCall();
	}
	function doCall() {
		if (hasCalled)
			return;
		hasCalled = true;
		cb();
	}

	$notice.click(fadeNow);

	setTimeout(function() {
		$notice.fadeIn(function() {
			if (cb)
				setTimeout(doCall, 5*1000);

			if (time)
				setTimeout(fadeNow, time*1000);
		});
	}, 1500);
}
