/*
 * misc.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/misc.js';
 *
 */

// Temporary https transition forcer.
// Making the site immediately issue 301 redirects would break thread
// auto-reloading for people currently in threads.
if (window.location.protocol != "https:" && (!window.localStorage || localStorage.last_https_send)) {
	window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
}

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
	
	if (window.localStorage && new Date() < new Date("Jul 14 2013 04:00:00")) {
		if (user_is_noob) {
			try {
				localStorage.no_show_pone_note = true;
			} catch(e) {}
		} else if (!localStorage.no_show_pone_note && settings.getSetting("style", true) == null) {
			notice.settingsAd('The old site style "Pone" is still available!', undefined, function() {
				try {
					localStorage.no_show_pone_note = true;
				} catch(e) {}
			});
		}
	}
	
	// Change back from Nightmare theme event
	try {
		var old = window.localStorage && localStorage.event_nightmare_old_style;
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
