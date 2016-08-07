/* @flow */

/**
 * dashboard
 *
 * Delegated events that were pulled out from the embedded html
 * in Tinyboard's dashboard.
 *
 */
import $ from 'jquery';

// Synchronize the 'public message' checkbox with its text field.
$(document).on('change', '[name="public_message"]', event => {
  $(event.target).nextAll('[name="message"]')
    .prop('disabled', !event.target.checked);
});
