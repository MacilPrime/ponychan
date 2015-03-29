/*
 * settings
 *
 * Released under the MIT license
 * Copyright (c) 2015 Macil Tech <maciltech@gmail.com>
 *
 */

import Immutable from 'immutable';
import React from 'react/addons';
const PureRenderMixin = React.addons.PureRenderMixin;

import settings from './settings';

const isModPage = (document.location.pathname == SITE_DATA.siteroot+'mod.php');

const InvalidItem = React.createClass({
	mixins: [PureRenderMixin],
	render() {
		const {value, setting} = this.props;
		const name = setting.get('name');
		const type = setting.get('type');
		return (
			<div>{name}, unsupported type: {type}</div>
		);
	}
});

const SelectItem = React.createClass({
	mixins: [PureRenderMixin],
	render() {
		const {value, setting} = this.props;
		const name = setting.get('name');
		const desc = setting.get('description');
		const options = setting.get('selectOptions').map(item => {
			const itemValue = item.get('value');
			const displayName = item.get('displayName');
			return (
				<option key={itemValue} value={itemValue}>
					{displayName}
				</option>
			);
		}).toArray();
		const onChange = event => {
			settings.setSetting(name, event.target.value);
		};
		return (
			<div>
				<select onChange={onChange} value={value}>
					{options}
				</select>
				{' '}
				<span>{desc}</span>
			</div>
		);
	}
});

const CheckboxItem = React.createClass({
	mixins: [PureRenderMixin],
	render() {
		const {value, setting} = this.props;
		const name = setting.get('name');
		const desc = setting.get('description');
		const toggle = event => {
			settings.setSetting(name, event.target.checked);
		};
		return (
			<label>
				<input type="checkbox" ref="input"
					checked={value} onChange={toggle} />
				<span className="setting_description">{desc}</span>
			</label>
		);
	}
});

const SettingItem = React.createClass({
	mixins: [PureRenderMixin],
	render() {
		const {setting, value} = this.props;
		const name = setting.get('name');

		const moredetails = setting.get('moredetails');
		if (setting.get('moredetails_rawhtml') || (moredetails && typeof moredetails !== 'string')) {
			console.log('bad setting', name);
		}
		const moredetailsComponent = typeof moredetails !== 'string' ? null :
			<div>{moredetails}</div>;

		const testButton = setting.get('testButton');
		const testButtonFn = event => {
			event.preventDefault();
			testButton.get('fn')();
		};
		const testButtonComponent = !testButton ? null :
			<div>
				<button onClick={testButtonFn}>{testButton.get('label')}</button>
			</div>;

		const extraComponent = !(moredetailsComponent || testButtonComponent) ? null :
			<div className="setting_more_details">
				{moredetailsComponent}
				{testButtonComponent}
			</div>;

		const ITEM_TYPES = {bool: CheckboxItem, select: SelectItem};
		const Tag = ITEM_TYPES[setting.get('type')] || InvalidItem;

		return (
			<div className="setting_item">
				<Tag {...this.props} />
				{extraComponent}
			</div>
		);
	}
});

const SettingsSection = React.createClass({
	mixins: [PureRenderMixin],
	render() {
		const {metadata, values, section} = this.props;
		const items = section.get('settings')
			.map(name => metadata.get(name))
			.filter(setting => !setting.get('hidden'))
			.map(setting => {
				const name = setting.get('name');
				const userValue = values.get(name);
				const value = userValue != null ? userValue : setting.get('defval');
				return (
					<SettingItem key={name} setting={setting} value={value} />
				);
			}).toArray();
		return (
			<section>
				<h2>{section.get('displayName')}</h2>
				{items}
			</section>
		);
	}
});

const SettingsCloseButton = React.createClass({
	mixins: [PureRenderMixin],
	render() {
		return (
			<span onClick={this.props.onClick} className="settings-close-button">
				X
			</span>
		);
	}
});

const SettingsWindow = React.createClass({
	mixins: [PureRenderMixin],
  render() {
		const {closeWindow, metadata, values, sections} = this.props;
		const sectionNodes = sections
			.filter(section => isModPage || !section.get('modOnly'))
			.map(section =>
				<SettingsSection
					metadata={metadata}
					values={values}
					section={section}
					key={section.get('name')}
					/>
			).toArray();
    return (
			<div>
				<SettingsCloseButton onClick={closeWindow}/>
	      <h1>Board Settings</h1>
				<hr/>
				{sectionNodes}
			</div>
    );
  }
});

function shouldDoCompatSettingsPage() {
	// Returns true if we don't think the normal settings
	// screen pop-up can be scrolled correctly by the
	// browser.

	// Check if we're on Android
	if (navigator.userAgent.match(/^Mozilla[^(]+\(Linux; U; Android[^)]*\).*Mobile Safari/)) {
		// Make sure we only match the stock browser, not Chrome
		return navigator.userAgent.indexOf("Chrome") == -1;
	}
	return false;
}

import $ from 'jquery';

function setup() {
	const $settingsScreen = $("<div/>")
		.attr("id", "settingsScreen")
		.addClass("settingsScreen")
		.hide();

	const $settingsButton = $("<a/>")
		.addClass("settingsButton")
		.text("settings");

	const $settingsSection = $("<span/>")
		.addClass("settingsSection")
		.addClass("boardlistpart")
		.append('[ ', $settingsButton, ' ]');

	const $settingsOverlay = $("<div/>")
		.attr("id", "settings-overlay")
		.click(hideWindow)
		.hide();

	let isSettingsPage = false;

	function showWindow(event) {
		if(!shouldDoCompatSettingsPage()) {
			event.preventDefault();
			if (!isSettingsPage) {
				$settingsOverlay.show();
				$settingsScreen.fadeIn("fast");
			}
		}
	}

	function hideWindow() {
		if (isSettingsPage) return;
		$settingsScreen.hide();
		$settingsOverlay.hide();
	}

	$(document).ready(function() {
		// If the settings stuff already is on the page, then remove
		// it. This can happen if the user saves the page from a web
		// browser and opens it again.
		$(".settingsScreen, .settingsSection, #settings-overlay").remove();

		const $settingsPage = $("#settingsPage");
		if ($settingsPage.length) {
			isSettingsPage = true;
			$settingsPage.empty();
			$settingsScreen.removeAttr('id').show().appendTo($settingsPage);
		} else {
			$(document.body).append($settingsOverlay, $settingsScreen);
			$(".boardlist").append($settingsSection);

			$(".settingsButton")
				.attr("href", SITE_DATA.siteroot+"settings.html")
				.click(showWindow);
		}
	});

	settings.getAllSettingsMetadata().onValue(
		function({settingsMetadata, settingsValues, settingsSectionsList}) {
			React.render(
				<SettingsWindow
					closeWindow={hideWindow}
					metadata={settingsMetadata}
					values={settingsValues}
					sections={settingsSectionsList}
					/>,
				$settingsScreen[0]
			);
		});
}

setup();
