/*
 * styles.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import _ from 'lodash';
import $ from 'jquery';
import settings from './settings';
import {log_error} from './logger';

const styleChoices = _.map(
	SITE_DATA.styles,
	(file, name) => ({value: name, displayName: name})
);

settings.newSetting("style", "select", SITE_DATA.selectedstyle, "Theme", 'pagestyle',
		    {orderhint: 1, selectOptions: styleChoices, defpriority: 0});

function apply(stylename) {
	if (SITE_DATA.styles[stylename] == null) {
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
	$stylesheet.attr("href", SITE_DATA.styles[stylename]);

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
