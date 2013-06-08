/*
 * spoiler-toggle.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/settings.js';
 *   $config['additional_javascript'][] = 'js/spoiler-toggle.js';
 *
 */

settings.newSetting("reveal_spoilers", "bool", false, "Reveal spoiler text", 'pagestyle', {orderhint: 2});

$(document).ready(function() {
	var reveal_spoilers;
	
	function processSpoilers(context) {
		if(reveal_spoilers)
			$(".spoiler", context).css("color", "white");
		else
			$(".spoiler", context).css("color", "");
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
