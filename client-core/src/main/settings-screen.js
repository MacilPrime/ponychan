/*
 * settings
 *
 * Released under the MIT license
 * Copyright (c) 2015 Macil Tech <maciltech@gmail.com>
 *
 */

import React from 'react';
import ReactDOM from 'react-dom';

import config from './config';
import settings from './settings';

const isSettingsPage = (document.location.pathname == config.site.siteroot+'settings.html');

import {SettingsWindow} from './settings-screen-components';

function shouldDoCompatSettingsPage() {
  // Returns true if we don't think the normal settings
  // screen pop-up can be scrolled correctly by the
  // browser.

  // Check if we're on Android
  if (navigator.userAgent.match(/^Mozilla[^(]+\(Linux; U; Android[^)]*\).*Mobile Safari/)) {
    // Make sure we only match the stock browser, not Chrome
    return navigator.userAgent.indexOf('Chrome') == -1;
  }
  return false;
}

import $ from 'jquery';

function setup() {
  const $settingsScreen = $('<div/>')
    .attr('id', 'settingsScreen')
    .addClass('settingsScreen')
    .hide();

  const $settingsButton = $('<a/>')
    .addClass('settingsButton')
    .text('settings');

  const $settingsSection = $('<span/>')
    .addClass('settingsSection')
    .addClass('boardlistpart')
    .append('[ ', $settingsButton, ' ]');

  const $settingsOverlay = $('<div/>')
    .attr('id', 'settings-overlay')
    .click(hideWindow)
    .hide();

  function showWindow(event) {
    if (!shouldDoCompatSettingsPage()) {
      event.preventDefault();
      if (!isSettingsPage) {
        $settingsOverlay.show();
        $settingsScreen.fadeIn('fast');
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
    $('.settingsScreen, .settingsSection, #settings-overlay').remove();

    if (isSettingsPage) {
      const $settingsPage = $('#settingsPage');
      $settingsPage.empty();
      $settingsScreen.removeAttr('id').show().appendTo($settingsPage);
    } else {
      $(document.body).append($settingsOverlay, $settingsScreen);
      $('.boardlist').append($settingsSection);

      $('.settingsButton')
        .attr('href', config.site.siteroot+'settings.html')
        .click(showWindow);
    }
  });

  settings.getAllSettingsMetadata().onValue(
    function({settingsMetadata, settingsValues, settingsSectionsList}) {
      ReactDOM.render(
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
