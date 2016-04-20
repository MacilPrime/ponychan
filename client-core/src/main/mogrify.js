const _ = require('lodash');
const $ = require('jquery');

// Disables all img, audio, video, and script tags in some html
export function mogrifyHTML(html) {
  function mogrifier(text) {
    return '<span class="mogrifier" data-data="' + _.escape(text) + '"></span>';
  }

  html = html.replace(/<img\b[^>]*>/g, mogrifier);
  html = html.replace(/<audio\b[^>]*>.*?<\/audio>/g, mogrifier);
  html = html.replace(/<video\b[^>]*>.*?<\/video>/g, mogrifier);
  html = html.replace(/<script\b[^>]*>.*?<\/script>/g, mogrifier);

  return html;
}

// Re-enables mogrified tags in an element
export function demogrifyEl($el) {
  $el.find('.mogrifier').each(function() {
    const $mog = $(this);
    const html = $mog.attr('data-data');
    $mog.html(html);
    $mog.children().unwrap();
  });
}

$(document).on('new_post', function(e, post) {
  demogrifyEl($(post));
});
