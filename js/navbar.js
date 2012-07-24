/*
 * navbar.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/settings.js';
 *   $config['additional_javascript'][] = 'js/navbar.js';
 *
 */

$(document).ready(function(){
	settings.newProp("fixed_navbar", "bool", true, "Navbar stays at the top of the window");

	var navbarApplySettings = function() {
		var navbar = $(".boardlist.top");
		if (settings.getProp("fixed_navbar", "bool")) {
			navbar.css("position", "fixed");
		} else {
			navbar.css("position", "absolute");
		}
	};

	navbarApplySettings();
	$(document).on("setting_change", function(e, setting) {
		if (setting == "fixed_navbar") {
			navbarApplySettings();
		}
	});
});
