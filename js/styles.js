/*
 * styles.js
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
	
	settings.newSetting("style", "select", selectedstyle, "Style", 'pagestyle',
			    {orderhint: 1, selectOptions: styleChoices});
	
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
