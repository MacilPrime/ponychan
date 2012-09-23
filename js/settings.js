/*
 * settings.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/settings.js';
 *
 */

var $settingsScreen = $("<div/>")
	.attr("id", "settingsScreen")
	.hide();

var $settingsTitle = $("<h1/>")
	.text("Board Settings")
	.appendTo($settingsScreen);

var $settingsCloseButton = $("<a/>")
	.text("X")
	.attr("href", "javascript:;")
	.appendTo($settingsTitle);

$("<hr/>").appendTo($settingsScreen);

var $settingsButton = $("<a/>")
	.text("settings")
	.attr("href", "javascript:;");

var $settingsSection = $("<span/>")
	.addClass("settingsButton")
	.addClass("boardlistpart")
	.append('[ ', $settingsButton, ' ]');

var $settingsOverlay = $("<div/>")
	.attr("id", "settings-overlay")
	.hide();

// DOM setup over

settings = {};

settings.showWindow = function() {
	var topPos = $(window).scrollTop()+$(window).height()/2;
	if (topPos < 200)
		topPos = 200;

	$settingsScreen
		.css("position", "absolute")
		.css("top", topPos+"px")
		.css("left", "50%")
		.css("margin-top", "-200px")
		.css("margin-left", "-200px");

	$settingsOverlay.show();
	$settingsScreen.fadeIn("fast");
	$(document.body).css("overflow", "hidden");

	if ($settingsScreen.position().left < 200)
		$settingsScreen.css("left", "200px");
};

settings.hideWindow = function() {
	$settingsScreen.hide();
	$settingsOverlay.hide();
	$(document.body).css("overflow", "");
};

$(document).on("style_changed", function() {
	if ($settingsScreen.is(":visible")) {
		$settingsScreen.hide();
		settings.showWindow();
	}
});

$settingsOverlay.click(settings.hideWindow);
$settingsCloseButton.click(settings.hideWindow);

var settingTypes = {};
var defaultValues = {};
var settingSelectOptions = {};

settings.getProp = function(name) {
	var id = "setting_"+name;
	
	var localVal = localStorage[id];
	if (localVal == null)
		return defaultValues[name];
	
	var type = settingTypes[name];
	switch(type) {
	case "bool":
		return localVal == "true";
	case "select":
		return localVal;
	}
	
	console.error("Invalid property type: "+type+", name: "+name);
	return undefined;
}

settings.setProp = function(name, value) {
	var id = "setting_"+name;
	
	var type = settingTypes[name];
	switch(type) {
	case "bool":
		localStorage[id] = value ? "true" : "false";
		break;
	case "select":
		localStorage[id] = value;
		break;
	default:
		console.error("Invalid property type: "+type+", name: "+name);
		return;
	}
	$(document).trigger("setting_change", name)
	return value;
}

settings.bindPropCheckbox = function($checkbox, name) {
	var changeGuard = false;
	if (settingTypes[name] !== "bool") {
		console.error("Can not bind checkbox to non-bool setting ("+name+", type:"+settingTypes[name]+")");
		return;
	}
	var value = settings.getProp(name);
	
	$checkbox
		.attr("checked", value)
		.change(function() {
			if(!changeGuard) {
				changeGuard = true;
				settings.setProp(name, $(this).attr("checked"));
				changeGuard = false;
				}
		});
	
	$(document).on("setting_change", function(e, setting) {
		if (!changeGuard && name == setting) {
			changeGuard = true;
			$checkbox.attr("checked", settings.getProp(name));
				changeGuard = false;
		}
	});
};

settings.bindPropSelect = function($select, name) {
	var changeGuard = false;
	if (settingTypes[name] !== "select") {
		console.error("Can not bind select to non-select setting ("+name+", type:"+settingTypes[name]+")");
		return;
	}
	var value = settings.getProp(name);
	var choices = settingSelectOptions[name];
	
	$.each(choices, function(key, text) {
		$("<option/>").attr("value", key).text(text).appendTo($select);
	});
	
	$select
		.val(settings.getProp(name))
		.change(function() {
			if(!changeGuard) {
				changeGuard = true;
				settings.setProp(name, $(this).val());
				changeGuard = false;
			}
		});
	
	$(document).on("setting_change", function(e, setting) {
		if (!changeGuard && name == setting) {
			changeGuard = true;
			$select.val(settings.getProp(name));
			changeGuard = false;
		}
	});
};

settings.newProp = function(name, type, defval, description, moredetails) {
	var id = "setting_"+name;
	
	settingTypes[name] = type;
	defaultValues[name] = defval;
	
	var $settingDiv = $("<div/>")
		.appendTo($settingsScreen);

	if (type==="bool") {
		var $label = $("<label/>")
			.attr("for", id)
			.text(" "+description)
			.appendTo($settingDiv);
		var $checkbox = $("<input/>")
			.attr("type", "checkbox")
			.attr("id", id)
			.prependTo($label);
		
		settings.bindPropCheckbox($checkbox, name);
	} else if (type==="select") {
		settingSelectOptions[name] = description[0];
		description = description[1];
		$settingDiv.text(" "+description);
		var $settingSelect = $("<select/>").prependTo($settingDiv);
		settings.bindPropSelect($settingSelect, name);
	} else {
		console.error("Unknown setting type ("+name+", type:"+type+")");
		$settingDiv.remove();
		return;
	}

	if (moredetails) {
		var $moredetails = $("<div/>")
			.addClass("setting_more_details")
			.text(moredetails)
			.appendTo($settingDiv);
	}
};

settings.getAllSettings = function() {
	var allSettings = {};
	$.each(settingTypes, function(index) {
		allSettings[index] = settings.getProp(index);
	});
	return allSettings;
};

$(document).ready(function() {
	// If the settings stuff already is on the page, then remove
	// it. This can happen if the user saves the page from a web
	// browser and opens it again.
	$("#settingsScreen, .settingsButton, #settings-overlay").remove();

	$(document.body).append($settingsOverlay, $settingsScreen);
	$(".boardlist").append($settingsSection);
	$(".settingsButton a").click(settings.showWindow);
});
