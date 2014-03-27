/*
 * local-time.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

settings.newSetting("time_casual", "bool", false, "12 hour time display", 'pagestyle', {orderhint: 4});

$(document).ready(function(){
	var time_casual, time_format_string;
	
	function init() {
		time_casual = settings.getSetting("time_casual");
		
		if (time_casual)
			time_format_string = "D MMM YYYY h:mm:ss A";
		else
			time_format_string = "D MMM YYYY HH:mm:ss";
		
		formatTimeElements(document.body);
	}
	init();
	
	$(document).on("setting_change", function(e, setting) {
		if (setting == "time_casual")
			init();
	});
	
	function formatTimeElements(context) {
		$("time", context).each(function() {
			var $t = $(this);
			$t.text(moment($t.attr('datetime')).format(time_format_string));
		});
	}
	
	// allow to work with auto-reload.js, etc.
	$(document).on('new_post', function(e, post) {
		formatTimeElements(post);
	});
});
