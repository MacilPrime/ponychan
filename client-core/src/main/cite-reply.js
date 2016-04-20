import $ from 'jquery';
import {get_post_num} from './lib/post-info';
import settings from './settings';

$(document).ready(function() {
  if ($('div.banner').length === 0) return;

  $(document).on('click', 'a.post_no.citelink', function(event) {
    event.preventDefault();
    const id = +$(event.target).attr('href').match(/\d+$/)[0];
    citeReply(id);
  });
});

function maybe_get_post_num(el) {
  const $post = $(el).parents('.post');
  return $post.length ? get_post_num($post) : null;
}

export default function citeReply(id) {
  let $message;
  if (settings.getSetting('use_QR')) {
    $message = $('#qrcomment');
    global.QR.open();
  } else {
    $message = $('#body');
    if (document.forms.post.scrollIntoView)
      document.forms.post.scrollIntoView();
  }
  let cited = '>>' + id + '\n';

  // select the content of the post first.
  if (window.getSelection) {
    const sel = window.getSelection();
    // we want to find if the highlighted selection overlaps
    // multiple posts. If it does, we'll ignore it.
    const startID = maybe_get_post_num(sel.anchorNode);
    const endID = maybe_get_post_num(sel.focusNode);

    if (id == startID && id == endID) {
      const text = sel.toString().trim();
      if (text.length > 0) {
        const lines = text.split('\n');
        let hasStarted = false;
        lines.forEach(line => {
          const newQuote = line.trim();
          if (hasStarted || newQuote.length > 0) {
            hasStarted = true;
            cited += '>' + newQuote + '\n';
          }
        });
      }
    }
  }

  const message = $message.val();

  if ('selectionStart' in $message.get(0)) {
    // if something is selected in the message box, replace it.
    const start = $message.get(0).selectionStart;
    const end = $message.get(0).selectionEnd;
    $message.val(
      message.slice(0, start) + cited + message.slice(end)
    );

    const afterInsert = start + cited.length;
    $message.get(0).setSelectionRange(afterInsert, afterInsert);
  } else {
    // If we couldn't figure out the selection, just append to it.
    $message.val(message + cited);
  }
  $message.focus();
  $message.trigger('input');
}
