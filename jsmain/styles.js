/*
 * styles.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/settings.js';
 *   $config['additional_javascript'][] = 'js/styles.js';
 *
 */

(function(exports) {
	var styleChoices = {};
	$.each(styles, function(name, file) {
		styleChoices[name] = name;
	});
	
	// Halloween Nightmare theme
	var useGc = new Date() < new Date("2014-04-02T08:00:00Z");
	if (useGc && window.localStorage) {
		try {
			localStorage.setItem("event_saw_gc", "true");
		} catch(e) {}
	}
	
	settings.newSetting("style", "select", useGc ? "Geocities" : selectedstyle, "Style", 'pagestyle',
			    {orderhint: 1, selectOptions: styleChoices, defpriority: useGc ? 3 : 0});
	
	function apply(stylename) {
		if (styles[stylename] == null) {
			console.log('Unknown style:', stylename);
			return;
		}
		var $stylesheet = $("#stylesheet");
		if ($stylesheet.length == 0) {
			$stylesheet = $("<link/>")
				.attr("rel", "stylesheet")
				.attr("type", "text/css")
				.attr("id", "stylesheet")
				.appendTo(document.head);
		}
		$stylesheet.attr("href", styles[stylename]);
		
		$(document).ready(function() {
			if (stylename == "Geocities") {
				let r = Math.random();
				let $music = $("audio.geocities");
				if ($music.length == 0) {
					$music = $("<audio/>")
						.attr("preload", "none")
						.attr("controls", "1")
						.addClass("geocities")
						.prependTo( $("footer").first() );
					
					if (r < 0.2) {
						$music.append(
							$("<source/>").attr({src:"https://crashcoherency.net/misc/what%20is%20love%20midi.ogg", type:"audio/ogg"}),
							$("<source/>").attr({src:"https://crashcoherency.net/misc/what%20is%20love%20midi.mp3", type:"audio/mpeg"})
						);
					} else if (r < 0.4) {
						$music.append(
							$("<source/>").attr({src:"https://crashcoherency.net/misc/radiantx-space_beacon.ogg", type:"audio/ogg"}),
							$("<source/>").attr({src:"https://crashcoherency.net/misc/radiantx-space_beacon.mp3", type:"audio/mpeg"})
						);
					} else if (r < 0.6) {
						$music.append(
							$("<source/>").attr({src:"https://crashcoherency.net/misc/5%20the%20stars%20come%20out.ogg", type:"audio/ogg"}),
							$("<source/>").attr({src:"https://crashcoherency.net/misc/5%20the%20stars%20come%20out.mp3", type:"audio/mpeg"})
						);
					} else if (r < 0.8) {
						$music.append(
							$("<source/>").attr({src:"https://crashcoherency.net/misc/4mat-Paper_Dolls.ogg", type:"audio/ogg"}),
							$("<source/>").attr({src:"https://crashcoherency.net/misc/4mat-Paper_Dolls.mp3", type:"audio/mpeg"})
						);
					} else {
						$music.append(
							$("<source/>").attr({src:"https://crashcoherency.net/misc/Mario%20Paint%20-%20Through%20the%20Fire%20and%20Flames%20-%20Dragonforce.ogg", type:"audio/ogg"}),
							$("<source/>").attr({src:"https://crashcoherency.net/misc/Mario%20Paint%20-%20Through%20the%20Fire%20and%20Flames%20-%20Dragonforce.mp3", type:"audio/mpeg"})
						);
					}

					try {
						if ($music[0].load)
							$music[0].load();
					} catch(e) {
						log_error(e);
					}
				}
			} else {
				$(".geocities").remove();
			}
		});
		
		$(document).trigger('style_changed', $stylesheet[0]);
	}
	exports.apply = apply;
	
	function applySelectedStyle() {
		apply(settings.getSetting("style"));
	}
	
	applySelectedStyle();
	$(document).on("setting_change", function(e, setting) {
		if (setting === "style") {
			applySelectedStyle();
		}
	});
})(window.styles||(window.styles={}));
