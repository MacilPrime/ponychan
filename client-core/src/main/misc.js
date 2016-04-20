/*
 * misc.js
 *
 */

import $ from 'jquery';
import {log_error} from './logger';

$(document).ready(function() {
  const $secondLine = $('footer .unimportant').slice(1,2);
  const $targetLink = $('footer .unimportant a').slice(1,2);

  const oldLink = $targetLink.attr('href');
  const newLink = global.SITE_DATA.siteroot+'mod.php';

  let unprepTimer = null;
  $secondLine.dblclick(function() {
    clearTimeout(unprepTimer);
    $targetLink.attr('href', newLink);
    unprepTimer = setTimeout(function() {
      $targetLink.attr('href', oldLink);
    }, 5*1000);
  });

  function betterName() {
    const $h = $('header h1').first();
    if ($h.text().trim().indexOf('/oat/ ') == 0)
      $h.text('/goat/ - Goatmeal');
  }

  if (Math.random() < 0.0014)
    betterName();

  if (window.localStorage) {
    try {
      localStorage.removeItem('event_saw_nightmare');
      localStorage.removeItem('event_saw_gc');
      localStorage.removeItem('saw_proposal');
    } catch (e) {
      log_error(e);
    }
  }
});
