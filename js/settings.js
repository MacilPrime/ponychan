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
	.addClass("settingsButton")
	.text("settings")
	.attr("href", "javascript:;");

var $settingsSection = $("<span/>")
	.addClass("settingsSection")
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

settings.getProp = function(name, noDefault) {
	var id = "setting_"+name;
	
	var localVal = localStorage[id];
	if (localVal == null)
		return noDefault ? null : defaultValues[name];
	
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
	
	if (value == null) {
		delete localStorage[id];
	} else {
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
		.prop("checked", value)
		.change(function() {
			if(!changeGuard) {
				changeGuard = true;
				settings.setProp(name, $(this).prop("checked"));
				changeGuard = false;
			}
		});
	
	$(document).on("setting_change", function(e, setting) {
		if (name == setting) {
			changeGuard = true;
			$checkbox.prop("checked", settings.getProp(name));
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
		if (name == setting) {
			changeGuard = true;
			$select.val(settings.getProp(name));
			changeGuard = false;
		}
	});
};

// Contains an array of tuples of [orderhint, name]
var section_order = [];
// Contains a key for each section, and then an array of tuples of the above format.
var section_prop_order = {};

settings.newSection = function(name, displayName, orderhint, modOnly) {
	if (orderhint == null)
		orderhint = 0;
	var id = "settings_section_"+name;

	if ($('#'+id).length)
		throw new Error('Section '+name+' already exists!');
	
	var $sectionDiv = $("<div/>")
		.addClass("setting_section")
		.attr("id", id);
	var $sectionHeader = $("<h2/>")
		.text(displayName)
		.prependTo($sectionDiv);
	
	if (modOnly) {
		$sectionDiv.addClass('mod_settings_section');
		if (document.location.pathname != siteroot+'mod.php')
			$sectionDiv.hide();
	}

	var nextname = null;
	for(var i=0; i<section_order.length; i++) {
		if (orderhint < section_order[i][0]) {
			nextname = section_order[i][1];
			section_order.splice(i, 0, [orderhint, name]);
			break;
		}
	}
	if (nextname == null) {
		section_order.push([orderhint, name]);
		$sectionDiv.appendTo($settingsScreen);
	} else {
		var next_section_id = "settings_section_"+nextname;
		var $nextSectionDiv = $settingsScreen.find('#'+next_section_id);
		if (!$nextSectionDiv.length)
			throw new Error('Could not find next section: '+nextname);
		$sectionDiv.insertBefore($nextSectionDiv);
	}
	section_prop_order[name] = [];
};

settings.newProp = function(name, type, defval, description, moredetails, section, orderhint) {
	if (orderhint == null)
		orderhint = 0;
	var id = "setting_"+name;
	
	settingTypes[name] = type;
	defaultValues[name] = defval;
	
	var section_id = "settings_section_"+section;
	var $sectionDiv = $settingsScreen.find("#"+section_id);
	if (!$sectionDiv.length || !section_prop_order.hasOwnProperty(section))
		throw new Error('Section '+section+' does not exist!');
	
	var $settingDiv = $("<div/>")
		.addClass("setting_part")
		.attr("id", id);
	
	if (type==="bool") {
		var $label = $("<label/>")
			.attr("for", "cb_"+id)
			.text(" "+description)
			.appendTo($settingDiv);
		var $checkbox = $("<input/>")
			.attr("type", "checkbox")
			.attr("id", "cb_"+id)
			.prependTo($label);
		
		settings.bindPropCheckbox($checkbox, name);
	} else if (type==="select") {
		settingSelectOptions[name] = description[0];
		description = description[1];
		$settingDiv.text(" "+description);
		var $settingSelect = $("<select/>").prependTo($settingDiv);
		settings.bindPropSelect($settingSelect, name);
	} else {
		$settingDiv.remove();
		throw new Error("Unknown setting type ("+name+", type:"+type+")");
	}

	if (moredetails) {
		var $moredetails = $("<div/>")
			.addClass("setting_more_details")
			.text(moredetails)
			.appendTo($settingDiv);
	}
	
	var nextname = null;
	var prop_order = section_prop_order[section];
	for(var i=0; i<prop_order.length; i++) {
		if (orderhint < prop_order[i][0]) {
			nextname = prop_order[i][1];
			prop_order.splice(i, 0, [orderhint, name]);
			break;
		}
	}
	if (nextname == null) {
		prop_order.push([orderhint, name]);
		$settingDiv.appendTo($sectionDiv);
	} else {
		var next_setting_id = "setting_"+nextname;
		var $nextSettingDiv = $settingsScreen.find('#'+next_setting_id);
		if (!$nextSettingDiv.length)
			throw new Error('Could not find next setting: '+nextname);
		$settingDiv.insertBefore($nextSettingDiv);
	}
};

settings.getAllSettings = function() {
	var allSettings = {};
	$.each(settingTypes, function(index) {
		allSettings[index] = settings.getProp(index);
	});
	return allSettings;
};

settings.newSection('pagestyle', 'Page Formatting', 1);
settings.newSection('filters', 'Filters', 4);
settings.newSection('links', 'Link Behavior', 2);
settings.newSection('posting', 'Posting', 3);
settings.newSection('mod', 'Moderation', 1.5, true);

$(document).ready(function() {
	// If the settings stuff already is on the page, then remove
	// it. This can happen if the user saves the page from a web
	// browser and opens it again.
	$("#settingsScreen, .settingsSection, #settings-overlay").remove();

	$(document.body).append($settingsOverlay, $settingsScreen);
	$(".boardlist").append($settingsSection);
	$(".settingsButton").click(settings.showWindow);
});
