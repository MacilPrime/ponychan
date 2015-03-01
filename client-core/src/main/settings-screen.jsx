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

const CheckboxItem = React.createClass({
	mixins: [PureRenderMixin],
	render() {
		const {value, setting} = this.props;
		const name = setting.get('name');
		const desc = setting.get('description');
		const toggle = (event) => {
			settings.setSetting(name, event.target.checked);
		};
		return (
			<div>
				<label>
					<input type="checkbox" ref="input"
						checked={value} onChange={toggle} />
					{desc}
				</label>
			</div>
		);
	}
});

const SettingsSection = React.createClass({
	mixins: [PureRenderMixin],
	render() {
		const {values, section} = this.props;
		const items = section.get('settings')
			.filter(setting => setting.get('type') === 'bool')
			.map(setting => {
				const name = setting.get('name');
				const userValue = values.get(name);
				const value = userValue != null ? userValue : setting.get('defval');
				return <CheckboxItem value={value} setting={setting} key={name} />;
			}).toArray();
		return (
			<section>
				<h2>{section.get('displayName')}</h2>
				{items}
			</section>
		);
	}
});

const SettingsWindow = React.createClass({
	mixins: [PureRenderMixin],
  render() {
		const {values, sections} = this.props;
		const sectionNodes = sections.map(section =>
			<SettingsSection
				values={values}
				section={section}
				key={section.get('name')}
				/>
		).toArray();
    return (
			<div>
	      <h1>Board Settings</h1>
				{sectionNodes}
			</div>
    );
  }
});

import $ from 'jquery';

function doStuff() {
	var $settingsScreen = $("<div/>")
		.attr("id", "settingsScreen")
		.addClass("settingsScreen")
		.hide();

	var $settingsTitle = $("<h1/>")
		.text("Board Settings")
		.appendTo($settingsScreen);

	var $settingsCloseButton = $("<a/>")
		.text("X")
		.addClass("settings-close-button")
		.attr("href", "javascript:;")
		.appendTo($settingsTitle);

	var $settingsTopHR = $("<hr/>").appendTo($settingsScreen);

	var $settingsButton = $("<a/>")
		.addClass("settingsButton")
		.text("settings");

	var $settingsSection = $("<span/>")
		.addClass("settingsSection")
		.addClass("boardlistpart")
		.append('[ ', $settingsButton, ' ]');

	var $settingsOverlay = $("<div/>")
		.attr("id", "settings-overlay")
		.hide();

	var isSettingsPage = false;

	function shouldCompatSettingsPage() {
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

	function showWindow() {
		if (isSettingsPage) return;
		$settingsOverlay.show();
		$settingsScreen.fadeIn("fast");
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

		var $settingsPage = $("#settingsPage");
		if ($settingsPage.length) {
			isSettingsPage = true;
			$settingsPage.text("");
			$settingsTitle.remove();
			$settingsTopHR.remove();
			$settingsScreen.removeAttr('id').show().appendTo($settingsPage);
		} else {
			$(document.body).append($settingsOverlay, $settingsScreen);
			$(".boardlist").append($settingsSection);

			if(shouldCompatSettingsPage()) {
				$(".settingsButton").attr("href", SITE_DATA.siteroot+"settings.html");
			} else {
				$(".settingsButton").attr("href", "javascript:;").click(showWindow);
			}
		}
	});

	$settingsOverlay.click(hideWindow);
	$settingsCloseButton.click(hideWindow);

	settings.getAllSettingsMetadata().onValue(
		function({settingsValues, settingsSectionsList}) {
			React.render(
				<SettingsWindow
					values={settingsValues}
					sections={settingsSectionsList}
					/>,
				$settingsScreen[0]
			);
		});
}

doStuff();
