/*
 * hide-trip.js
 *
 * Released under the WTFPLv2 license
 *
 */

import settings from './settings';

settings.newSetting("hide_trip_field", "bool", false, "Hide the name/tripcode input field", 'posting', {orderhint:4, moredetails:"Good to use if others can see your screen."});

$(document).ready(function() {
	var hide_trip = settings.getSetting("hide_trip_field");

	function init() {
		if (hide_trip)
			setCss("hide_trip", "input#qrname:not(:focus), input[name='name']:not(:focus) { color: #888 !important; background: #888 !important; } input#qrname:hover:not(:focus), input[name='name']:hover:not(:focus) { color: #aaa !important; background: #aaa !important; }");
		else
			setCss("hide_trip", "");
	}

	init();

	$(document).on("setting_change", function(e, setting) {
		if (setting === "hide_trip_field") {
			hide_trip = settings.getSetting("hide_trip_field");
			init();
		}
	});
});
