/*
 * misc.js
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
	
	// Change back from second Nightmare theme event
	if (new Date() >= new Date("2013-11-01T07:00:00Z") && window.localStorage && localStorage.getItem("event_saw_nightmare")) {
		notice.settingsAd('The Nightmare style is still available!', undefined, function() {
			localStorage.removeItem("event_saw_nightmare");
		});
	}
});
