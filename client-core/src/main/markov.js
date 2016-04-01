import $ from 'jquery';
import {log_error} from './logger';
import {defn} from 'ud';
import Kefir from 'kefir';

const END_TIME = new Date('Apr 2 2016 02:00:00 GMT-0700');

export const MARKOV_END_STREAM = Kefir.interval(2*60*1000)
    .toProperty(() => null)
    .filter(() => new Date() > END_TIME)
    .take(1)
    .toProperty();

export async function markov($button, $textarea) {
  try {
    $button.prop("disabled", true);
    const text = $textarea.val();
    const selectionStart = $textarea[0].selectionStart || text.length;

    const before = text.slice(0, selectionStart);
    const m = before.match(/[^>.!?\n]*$/);
    const sentence = m && m[0] || '';

    const {rest} = await $.ajax({
      url: `${SITE_DATA.siteroot}markov/autocomplete`,
      contentType: 'application/json',
      type: 'POST',
      data: JSON.stringify({sentence})
    });

    if (!rest) {
      alert("Couldn't determine how to finish the sentence.");
    } else {
      const space = (!sentence.length || sentence[sentence.length-1] === ' ') ?
        '' : ' ';
      $textarea.val(
        text.slice(0, selectionStart) + space + rest +
        text.slice(selectionStart)
      );
      const afterInsert = selectionStart + space.length + rest.length;
      $textarea.focus();
      $textarea[0].setSelectionRange(afterInsert, afterInsert);
    }
  } catch(err) {
    log_error(err);
    alert(`Error: ${err.message || err.responseText}`);
  }
  $button.prop("disabled", false);
}
