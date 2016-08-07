/* @flow */

import $ from 'jquery';

export default function setCss(key: string, css: string) {
  let $style = $('style.setcss#setcss_'+key);
  if (!$style.length && css) {
    $style = $('<style/>')
      .addClass('setcss')
      .attr('id', 'setcss_'+key)
      .attr('type', 'text/css')
      .appendTo(document.head);
  }
  $style.text(css);
}
