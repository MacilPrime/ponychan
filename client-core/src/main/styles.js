/* @flow
 * styles.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import _ from 'lodash';
import $ from 'jquery';
import config from './config';
import settings from './settings';

const styleChoices = config.site.styles.map(({name, displayName}) => ({value: name, displayName}));

const now = new Date();
const isHalloween = new Date('2016-10-31T07:00:00Z') <= now && now <= new Date('2016-11-01T07:00:00Z');

const default_stylesheet = isHalloween ? 'Nightmare' : config.site.default_stylesheet;
const defpriority = isHalloween ? 1477893787191 : 0;

settings.newSetting(
	'style', 'select',
	default_stylesheet,
	'Theme', 'pagestyle',
	{orderhint: 1, selectOptions: styleChoices, defpriority});

function getStyleURI(stylename) {
  const entry = _.find(config.site.styles, entry => entry.name === stylename);
  return !entry ? null : entry.uri;
}

function apply(stylename: string) {
  const uri = getStyleURI(stylename);
  if (uri == null) {
    console.log('Unknown style:', stylename); //eslint-disable-line no-console
    return;
  }
  let $stylesheet = $('#stylesheet');
  if ($stylesheet.length == 0) {
    $stylesheet = $('<link/>')
      .attr('rel', 'stylesheet')
      .attr('type', 'text/css')
      .attr('id', 'stylesheet')
      .appendTo(document.head);
  }
  $stylesheet.attr('href', uri);

  $(document).trigger('style_changed', $stylesheet[0]);
}
exports.apply = apply;

function applySelectedStyle() {
  apply(settings.getSetting('style'));
}

applySelectedStyle();
$(document).on('setting_change', function(e, setting) {
  if (setting === 'style') {
    applySelectedStyle();
  }
});
