/*
 * permalink.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 * Necessary so that reply links on noko50 pages to visible posts don't lead
 * off of the current page.
 *
 */

$(document).ready(function() {
	if($('div.banner').length == 0)
		return; // not index

	function permalinkClick(event) {
		var href = $(this).attr('href');
		var hash = /#(.*)$/.exec(href)[1];
		if ($('#replyC_'+hash).not('.preview-hidden').length) {
			window.location.hash = hash;
			event.preventDefault();
		}
	}

	function permalinkProcess() {
		$(this).click(permalinkClick);
	};

	$('.permalink').each(permalinkProcess);

	$(document).bind('new_post', function(e, post) {
		$('.permalink', post).each(permalinkProcess);
	});
});
