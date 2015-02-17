/*
 * spoiler-toggle.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/settings.js';
 *   $config['additional_javascript'][] = 'js/spoiler-toggle.js';
 *
 */

import settings from './settings';

settings.newSetting("reveal_spoilers", "bool", false, "Reveal spoiler text", 'pagestyle',
	{orderhint: 2, defpriority: 1});

$(document).ready(function() {
	var reveal_spoilers;

	function processSpoilers(context) {
		if(reveal_spoilers)
			$(".spoiler, .spoiler *", context).addClass("spoiler-force-color");
		else
			$(".spoiler-force-color", context).removeClass("spoiler-force-color");
	}

	function init() {
		reveal_spoilers = settings.getSetting("reveal_spoilers");
		processSpoilers(document);
	}
	init();

	$(document).on("setting_change", function(e, setting) {
		if (setting == "reveal_spoilers")
			init();
	});

	$(document).on('new_post', function(e, post) {
		processSpoilers(post);
	});
});
