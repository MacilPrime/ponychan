/*
 * misc.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/misc.js';
 *
 */

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

	// Change back from Nightmare theme event
	try {
		var old = localStorage.event_nightmare_old_style;
		if (old) {
			if (settings.getSetting("style") == "Nightmare" && old != "Nightmare") {
				console.log("Resetting to pre-Nightmare style");
				if (old == "null")
					settings.setSetting("style", null);
				else
					settings.setSetting("style", old);
				
				notice.settingsAd('The Nightmare style is still available!');
			}
			delete localStorage.event_nightmare_old_style;
		}
	} catch (e) {
		send_error(e);
	}
});
