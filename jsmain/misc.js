/*
 * misc.js
 *
 */

var log_error = require('./logger').log_error;

$(document).ready(function(){
	var $secondLine = $("footer .unimportant").slice(1,2);
	var $targetLink = $("footer .unimportant a").slice(1,2);

	var oldLink = $targetLink.attr("href");
	var newLink = siteroot+"mod.php";

	var unprepTimer = null;
	$secondLine.dblclick(function() {
		clearTimeout(unprepTimer);
		$targetLink.attr("href", newLink);
		unprepTimer = setTimeout(function() {
			$targetLink.attr("href", oldLink);
		}, 5*1000);
	});

	function betterName() {
		var $h = $("header h1").first();
		if ($h.text().trim().indexOf('/oat/ ') == 0)
			$h.text('/goat/ - Goatmeal');
	}

	if (Math.random() < 0.0014)
		betterName();

	if (window.localStorage) {
		try {
			localStorage.removeItem("event_saw_nightmare");
			localStorage.removeItem("event_saw_gc");
		} catch (e) {
			log_error(e);
		}
	}
});
