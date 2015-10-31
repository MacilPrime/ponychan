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

const now = new Date();
const isHalloween = new Date("2015-10-31T07:00:00Z") <= now && now <= new Date("2015-11-01T07:00:00Z");

const default_stylesheet = isHalloween ? 'Nightmare' : SITE_DATA.default_stylesheet;
const defpriority = isHalloween ? 1446285304140 : 0;

settings.newSetting(
	"style", "select",
	default_stylesheet,
	"Theme", 'pagestyle',
	{orderhint: 1, selectOptions: styleChoices, defpriority});

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
