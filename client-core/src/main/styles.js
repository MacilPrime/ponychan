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

const styleChoices = SITE_DATA.styles.map(({name, displayName}) => ({value: name, displayName}));

settings.newSetting(
	"style", "select",
	SITE_DATA.default_stylesheet,
	"Theme", 'pagestyle',
	{orderhint: 1, selectOptions: styleChoices, defpriority: 0});

function getStyleURI(stylename) {
	if (Array.isArray(SITE_DATA.styles)) {
		const entry = _.find(SITE_DATA.styles, entry => entry.name === stylename);
		return !entry ? null : entry.uri;
	} else {
		return SITE_DATA.styles[stylename];
	}
}

function apply(stylename) {
	const uri = getStyleURI(stylename);
	if (uri == null) {
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
	$stylesheet.attr("href", uri);

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
