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
		if ($h.text().trim() == '/oat/ - Oatmeal')
			$h.text('/goat/ - Goatmeal');
	}

	if (Math.random() < 0.0014)
		betterName();

	// Change back from Nightmare theme event
	try {
		var old = localStorage.event_nightmare_old_style;
		if (old) {
			if (settings.getProp("style") == "Nightmare" && old != "Nightmare") {
				console.log("Resetting to pre-Nightmare style");
				if (old == "null")
					settings.setProp("style", null);
				else
					settings.setProp("style", old);
				
				var $navbar = $(".boardlist.top").first();
				var $notice = $("<div/>")
					.appendTo(document.body)
					.hide()
					.addClass("popnotice")
					.text("The Nightmare style is still available! \u2191")
					.css("cursor", "default")
					.css("box-shadow", "0 -1px 8px black")
					.css("background-color", "rgb(34, 34, 34)")
					.css("color", "rgb(221, 221, 221)")
					.css("position", "fixed")
					.css("top", $navbar.height()+"px")
					.css("right", "0")
					.css("margin", "10px")
					.css("padding", "5px");
				
				var hasFaded = false;
				
				function fadeNow() {
					if (hasFaded)
						return;
					hasFaded = true;
					$notice.fadeOut();
				}
				
				$notice.click(fadeNow);
				
				setTimeout(function() {
					$notice.fadeIn();
					setTimeout(fadeNow, 30*1000);
				}, 1500);
			}
			delete localStorage.event_nightmare_old_style;
		}
	} catch (e) {
		send_error(e);
	}
});
