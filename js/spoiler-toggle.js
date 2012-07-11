/*
 * spoiler-toggle.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/settings.js';
 *   $config['additional_javascript'][] = 'js/spoiler-toggle.js';
 *
 */

$(document).ready(function() {
	settings.newProp("reveal_spoilers", "bool", false, "Reveal spoilers");

	var processSpoilers = function(context) {
		if(settings.getProp("reveal_spoilers", "bool"))
			$(".spoiler", context).css("color", "white");
		else
			$(".spoiler", context).css("color", "");
	}

	processSpoilers(document);

	$(document).on("setting_change", function(e, setting) {
		if (setting == "reveal_spoilers")
			processSpoilers(document);
	});

	$(document).on('new_post', function(e, post) {
		processSpoilers(post);
	});
});
