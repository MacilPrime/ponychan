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

	var prepped = false;
	var unprepTimer = null;
	$secondLine.dblclick(function() {
		prepped = true;
		clearTimeout(unprepTimer);
		unprepTimer = setTimeout(function() {
			prepped = false;
		}, 15*1000);
	});

	var $secondLink = $("footer .unimportant a").slice(1,2);
	$secondLink.click(function() {
		if(prepped) {
			window.location.href = "/mod.php";
			return false;
		}
	});
});
