/*
 * settings.js
 *
 * Released under the MIT license
 * Copyright (c) 2015 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import _ from 'lodash';
import Bacon from 'baconjs';
import Immutable from 'immutable';

let settingsMetadata = Immutable.Map();
let settingsValues = Immutable.Map();
let settingsSectionsList = Immutable.List();

const refresher = new Bacon.Bus();

const getSettingStream = _.memoize(name =>
	settingsMetadata.get(name).get('bus')
		.toProperty(null)
		.map(() => getSetting(name))
);

// Throws an error if the given value isn't valid for the named setting.
function checkSettingValue(setting, value) {
	const settingData = settingsMetadata.get(setting);
	const type = settingData.get('type');
	switch(type) {
		case "bool":
			if (typeof value !== "boolean") {
				throw new Error(`setting ${setting} was expected to be boolean but was: ${value}`);
			}
			break;
		case "number":
			if (typeof value !== "number" || isNaN(value)) {
				throw new Error(`setting ${setting} was expected to be a number but was ${value}`);
			}
			break;
		case "select":
			if (!settingData.get('selectOptions').find(item => item.get('value') === value)) {
				throw new Error(`setting ${setting} was not a valid option: ${value}`);
			}
			break;
	}
	const validator = settingData.get('validator');
	if (validator) {
		validator(value);
	}
}

function _readSetting(name) {
	const settingData = settingsMetadata.get(name);

	if (!settingData)
		throw new Error("No such setting: "+name);

	// At the end of this if-else block, localVal will either have null, meaning that the
	// user has not set the setting, or it will be a 2-length array of [value, priority].
	// See newSetting's extra.defpriority param for explanation of priority.
	let localVal = null;
	if (window.localStorage) {
		const id = "setting_"+name;

		if (localStorage.getItem(id)) {
			// settings are now stored in localStorage as a JSON encoded string of the
			// [value, priority] tuple, but they used to be stored as a simple string
			// representing value in a way specific to the type. We need to still be
			// able to read that. Default priority to 0.
			const type = settingData.get('type');
			let rawVal = localStorage.getItem(id);
			try {
				localVal = JSON.parse(rawVal);
				if (!Array.isArray(localVal) || localVal.length != 2 || typeof localVal[1] !== "number") {
					console.error("localVal has bad format:", localVal);
					localVal = null;
				}
				// setting type checking
				try {
					checkSettingValue(name, localVal[0]);
				} catch(e) {
					console.warn(e);
					localVal = null;
				}
			} catch(e) {
				console.error("Could not parse rawVal:", rawVal, e);
				localVal = null;
			}
		}
	}

	if (localVal != null) {
		const [value, defpriority] = localVal;
		if (defpriority >= settingData.get('defpriority')) {
			return value;
		}
	}
	return null;
}

function getSetting(name, noDefault=false) {
	const settingData = settingsMetadata.get(name);
	const settingValue = settingsValues.get(name);

	if (!settingData)
		throw new Error("No such setting: "+name);

	if (settingValue != null) {
		return settingValue;
	} else if (noDefault) {
		return null;
	} else {
		return settingData.get('defval');
	}
}

function setSetting(name, value, notquiet=false) {
	const id = "setting_"+name;
	const settingData = settingsMetadata.get(name);

	if (!settingData)
		throw new Error("No such setting: "+name);

	if (!window.localStorage && notquiet)
		alert("Your browser does not support the localStorage standard. Settings will not be saved. Please upgrade your browser!");

	if (value == null) {
		if (window.localStorage) {
			localStorage.removeItem(id);
		}
	} else {
		try {
			checkSettingValue(name, value);
		} catch(e) {
			console.warn('Error while trying to set setting', name, value, e);
			if (notquiet && e && e.message) {
				alert(e.message);
			}
			return;
		}
		const toWrite = [value, settingData.get('defpriority')];

		if (window.localStorage) {
			try {
				localStorage.setItem(id, JSON.stringify(toWrite));
			} catch(e) {
				if (notquiet)
					alert("Failed to set setting: "+e);
				throw e;
			}
		}
	}

	settingsValues = settingsValues.set(name, value);
	settingsMetadata.get(name).get('bus').push();
	$(document).trigger("setting_change", name);
}

function bindCheckbox($checkbox, name) {
	var changeGuard = false;
	const settingData = settingsMetadata.get(name);
	const type = settingData.get('type');

	if (type !== "bool") {
		throw new Error("Can not bind checkbox to non-bool setting ("+name+", type:"+type+")");
	}

	$checkbox
		.prop("checked", getSetting(name))
		.change(function() {
			if(!changeGuard) {
				changeGuard = true;
				setSetting(name, $(this).prop("checked"), true);
				changeGuard = false;
			}
		});

	getSettingStream(name).onValue(value => {
		changeGuard = true;
		$checkbox.prop("checked", value);
		changeGuard = false;
	});
}

function newSection(name, displayName, orderhint, modOnly=false) {
	settingsSectionsList = settingsSectionsList.push(Immutable.Map({
		name, displayName, orderhint, modOnly,
		settings: Immutable.List()
	})).sortBy(section => section.get('orderhint'));

	refresher.push();
}

// Adds a setting to the settings menu.
// parameters:
//  name: setting id string. Needs to be unique against other settings.
//  type: can be "bool" or "select".
//  defval: the default value.
//  description: the visible title shown in the settings menu for the setting.
//  extra: is an object containing zero or more of the following properties:
//   moredetails: extra text about the setting to display under the short description
//   testButton: can be an object of the form {label:String, fn:Function}
//   orderhint: number that will control the ordering of settings in the same section
//   selectOptions: required if type is "select". Should be an array of objects with
//                  value and displayName properties.
//   defpriority: defaults to 0. If this is higher than the value of defpriority at the
//                time the user last changed the setting, then the defval will take priority
//                over the user's value. This allows the default setting to be changed at a
//                future time, optionally overriding an older setting set by the user.
//   hider: If set to a Bacon stream, then the setting will be hidden as long
//					as it emits true.
//   notSupported: If true, then the setting will be disabled and a message will be shown
//                 to the user explaining that their browser does not support the setting.
//   validator: Function to validate the value of the setting when it's loaded or
//              changed. Should throw an exception with an error message if the value is
//              not deemed valid.
function newSetting(name, type, defval, description, section, extra={}) {
	const moredetails = extra.moredetails;
	const selectOptions = extra.selectOptions && Immutable.fromJS(extra.selectOptions);
	const testButton = extra.testButton && Immutable.fromJS(extra.testButton);
	const orderhint = extra.orderhint || 0;
	const defpriority = extra.defpriority || 0;
	const validator = extra.validator;

	if (settingsMetadata.has(name))
		throw new Error(`Setting ${name} has already been defined!`);

	const sectionEntryIndex = settingsSectionsList
		.findIndex(sectionEntry => sectionEntry.get('name') === section);
	if (sectionEntryIndex == null)
		throw new Error(`Section ${section} does not exist!`);

	if (Boolean(selectOptions) != (type === 'select'))
		throw new Error('selectOptions required for select type');

	const disableMessage = !extra.notSupported ? null :
		'Your browser does not support this setting. Firefox or Chrome are recommended.';

	const bus = new Bacon.Bus();

	const settingMetadata = Immutable.Map({
		name, section, orderhint, type, validator,
		description, moredetails, selectOptions,
		hidden: !!extra.hider, testButton, disableMessage,
		defval, defpriority,
		bus
	});

	settingsMetadata = settingsMetadata.set(name, settingMetadata);
	const userValue = _readSetting(name);
	settingsValues = settingsValues.set(name, userValue);

	settingsSectionsList = settingsSectionsList.updateIn(
		[sectionEntryIndex, 'settings'],
		settingsList =>
			settingsList.push(name).sortBy(name => settingsMetadata.get(name).get('orderhint'))
	);

	refresher.plug(bus);
	refresher.push();

	if (extra.hider) {
		extra.hider.onValue(hidden => {
			settingsMetadata = settingsMetadata.setIn([name, 'hidden'], hidden);
			refresher.push();
		});
	}
}

function getAllSettingValues(noDefault=false) {
	if (noDefault) {
		return settingsValues.toJS();
	} else {
		return settingsValues
			.map((value, name) => value !== null ? value : getSetting(name))
			.toJS();
	}
}

const getAllSettingsMetadata = _.once(() =>
	refresher.toProperty(null).map(() => ({settingsMetadata, settingsValues, settingsSectionsList}))
);

newSection('pagestyle', 'Page Formatting', 1);
newSection('mod', 'Moderation', 1.5, true);
newSection('links', 'Link Behavior', 2);
newSection('posting', 'Posting', 3);
newSection('reloader', 'Thread Auto-Updater', 4);
newSection('filters', 'Filters', 5);

const settings = {
	getSetting, getSettingStream, setSetting,
	bindCheckbox, checkSettingValue,
	newSection, newSetting,
	getAllSettingValues,
	getAllSettingsMetadata
};
export default settings;
