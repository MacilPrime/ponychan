/*
 * local-time.js
 * https://github.com/savetheinternet/Tinyboard/blob/master/js/local-time.js
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/local-time.js';
 *
 */

$(document).ready(function(){
	var iso8601 = function(s) {
		s = s.replace(/\.\d\d\d+/,""); // remove milliseconds
		s = s.replace(/-/,"/").replace(/-/,"/");
		s = s.replace(/T/," ").replace(/Z/," UTC");
		s = s.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"); // -04:00 -> -0400
		return new Date(s);
	};
	var zeropad = function(num, count) {
		return [Math.pow(10, count - num.toString().length), num].join('').substr(1);
	};
	
	var makeLocalTime = function() {
		var t = iso8601($(this).attr('datetime'));
		
		$(this).text(
			// day
			["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][t.getDay()] + ", " +
			// date
			zeropad(t.getDate(), 2) + " " + 
			["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", 
				"Oct", "Nov", "Dec"][t.getMonth()] + " " + 
			t.getFullYear() + " " +
			// time
			zeropad(t.getHours(), 2) + ":" + 
			zeropad(t.getMinutes(), 2) + ":" + 
			zeropad(t.getSeconds(), 2)
		);
	};

	$('time').each(makeLocalTime);

	// allow to work with auto-reload.js, etc.
	$(document).bind('new_post', function(e, post) {
		$('time', post).each(makeLocalTime);
	});
});

