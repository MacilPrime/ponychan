/*
 * state.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';

var original_page_title = document.title;
if (typeof history != 'undefined' && history && history.state) {
	applyState(history.state);
}

function newState(state, url) {
	applyState(state);

	if (typeof history != 'undefined' && history && history.pushState) {
		if (url)
			history.pushState(state, document.title, url);
		else
			history.pushState(state, document.title);
	}
}
exports.newState = newState;

function applyState(state) {
	$(document).ready(function() {
		if (state && state.hasOwnProperty('title')) {
			document.title = state.title;
		} else {
			document.title = original_page_title;
		}
		if (state && state.hasOwnProperty('banpage')) {
			var $banbody = $($.parseHTML(state.banpage)).filter('.ban');
			$('.ban').remove();
			$(document.body).children().addClass('ban-hidden');
			$(document.body).append($banbody);
			demogrifyEl($banbody);
		} else {
			var $bh = $('.ban-hidden');
			if ($bh.length) {
				$bh.removeClass('ban-hidden');
				$('.ban').remove();
			}
		}
	});
}

$(window).on('popstate', function(event) {
	applyState(event.originalEvent.state);
});
