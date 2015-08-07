/*
 * notice.js
 *
 * Released under the MIT license
 * Copyright (c) 2014 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import RSVP from 'rsvp';
import Bacon from 'baconjs';

export function settingsAd(text, time) {
	return pop(text+' \u2191', time);
}

export function pop(text, time = 30) {
	const $navbar = $(".boardlist.top").first();
	const $pop = $("<div/>")
		.hide()
		.text(text)
		.fadeIn('fast')
		.addClass("popnotice")
		.css("top", $navbar.height()+"px")
		.appendTo(document.body);

	return new RSVP.Promise(resolve => {
		const seconds = s => s * 1000;
		// Above function is to convert seconds to milliseconds.

		Bacon.mergeAll(
			Bacon.fromEvent($pop, 'click'),
			Bacon.later(seconds(time))
		).take(1)
			.onValue(() => $pop.fadeOut(seconds(1), resolve));
	}).then(() => $pop.remove());
}
