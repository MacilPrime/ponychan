/*
 * styles.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/settings.js';
 *   $config['additional_javascript'][] = 'js/styles.js';
 *
 */

var styleChoices = {};
$.each(styles, function(name, file) {
	styleChoices[name] = name;
});

settings.newProp("style", "select", selectedstyle, [styleChoices, "Style"], null, 'pagestyle', 1);

var Styles = {};
Styles.apply = function(stylename) {
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

var applySelectedStyle = function() {
	Styles.apply(settings.getProp("style"));
};

applySelectedStyle();
$(document).on("setting_change", function(e, setting) {
	if (setting == "style") {
		applySelectedStyle();
	}
});
