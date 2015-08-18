/**
 * post-controls
 *
 * Events binded to default tinyboard moderation controls.
 *
 */
import $ from 'jquery';
import RSVP from 'rsvp';
import {pop} from './notice';
import {get_post_num, get_post_name, get_post_trip, get_post_body} from './post-info';
import {updateThreadNow} from './legacy/reloader';

$(document).on('click', '.controls a', evt => {

	if (evt.which !== 2 && !evt.ctrlKey && !evt.shiftKey) {
		// ignore new-window clicks.

		evt.preventDefault();
		let $post = $(evt.target).closest(".post");

		switch (evt.target.textContent) {
			case '[D]':
				if (confirm('Are you sure you want to delete this?'))
					submitAction(evt.target.href).then(() => {
						pop('Post no. '+get_post_num($post)+' has been removed.', 5);
							updateThreadNow(true);
					});
				break;
			case '[D+]':
				if (confirm('Are you sure you want to delete all '
					+ 'posts by this IP address on this board?'))
					submitAction(evt.target.href).then(redirect);
				break;
			case '[D++]':
				if (confirm('Are you sure you want to delete all '
					+ 'posts by this IP address on all boards?'))
					submitAction(evt.target.href).then(redirect);
				break;
			case '[F]':
				if (confirm('Are you sure you want to delete this file?'))
					submitAction(evt.target.href).then(() => {
						pop('File for post no. '+get_post_num($post)+' has been removed.', 10);
						$(evt.target).remove(); // this button is no longer needed.
						// lower the opacity of the image to gesture that its source
						// is removed.
						$post.find('> a > .postimg').addClass('dead-file');
						updateThreadNow(true)
					});
				break;
			case '[B]':
			case '[B&D]':
				ban(evt.target.href, $post)
					.then(() => {
						pop(get_post_name($post) + get_post_trip($post)
						+ ' (No. ' + get_post_num($post) + ') has been banned.');
						updateThreadNow(true)
					}).catch(error => pop(error));
				break;
			default:
				redirect();
		}
		function redirect() {
			window.location = evt.target.href;
		}
	}
});

function submitAction(url, $form) {
	const hasForm = $form instanceof $;
	// If the 2nd (optional) parameter is specified, it sends a POST request.
	return new RSVP.Promise((resolve, reject) => {
		$.ajax(url, {
			method: hasForm ? 'POST' : 'GET',
			data: (() => {
				if (hasForm) {
					return $form.serialize() + $form
							.find('input[type="submit"], input[type="button"]')
							// jQuery's serialize() doesn't include buttons:
							// https://stackoverflow.com/questions/9866459/
							.filter((i, btn) => btn.name != null && btn.value != null)
							.map((i, btn) => '&'+encodeURI(btn.name)+'='+encodeURI(btn.value))
							.get()
							.reduce((a, b) => a + b);
				}
				return null;
			})(),
			cache: true,
			// FIXME Setting this to 'false' triggers an invalid security token error
			// because it thinks the unix timestamp trailing the url is the token.
			processData: false,
			beforeSend() {
				if (hasForm) toggleFormControls(false);
			},
			success(data) {
				resolve($($.parseHTML(data)));
			},
			error(xhr, status, err) {
				if (hasForm) toggleFormControls(true);
				pop('Fatal: '+xhr.status+' '+err, 5);
				reject();
			}
		});
		function toggleFormControls(enable) {
			$form.find(':input').each((i, input) => {
				const $input = $(input);
				if (enable) {
					if ('disabled' in $input.data())
						$input.prop('disabled', $input.data('disabled'))
							.removeData('disabled');
					// Restore the original value and erase the cached data.
					else
						$input.prop('disabled', 'false');
					// No data given. Always enable.
				} else {
					$input.data('disabled', $input.prop('disabled'))
						.prop('disabled', 'true');
					// Cache the original value and always disable.
				}
			})
		}
	});
}

function ban(url, $post) {
		return new RSVP.Promise((resolve, reject) => {
			submitAction(url).then($data => {
				// Load the ban form. Both the form and the path of the submitted ban
				// have the same path. They're interpreted differently depending on what's in
				// their request headers.
				const $banForm = $data.filter('.banform').first();
				const $existingFields = $post.find('.ban-fields');
				if ($banForm.length == 0) {
					pop('Fatal: The form requested in the page was not found.');
					return;
				}
				const andDelete = $banForm.find('[name="delete"]').val();
				// 'andDelete' is a string of value 0 or 1.
				if ($post
						.find(".banform [name='delete']")
						.filter((i, input) => input.value == andDelete)
						// "is this the same form?"
						.length > 0) {
					retract($existingFields);
					return;
				} else {
					retract($existingFields);
				}
				// - Manipulate the contents of the ban form -
				// 1. Don't break W3C spec by having multiple
				// elements of the same ID in the same page.
				$banForm.find('[id]').removeAttr('id');

				// 2. Don't show the IP field since we have both that
				// and the context of the ban in front of our nose.
				$banForm.find('[name="mask"]')
					.attr('type', 'hidden')
					.closest('tr')
					.css('display', 'none');

				// 3. Cancel button.
				$('<input />')
					.val('Cancel')
					.attr('type', 'button')
					.click(evt => retract($(evt.target).closest('.ban-fields')))
					.insertBefore($banForm.find('[name="new_ban"]'));

				$('<fieldset />')
					.addClass('ban-fields')
					.append(
					$('<legend />')
						.addClass('ban-header')
						.text(andDelete == "1" ? 'Ban & delete' : 'New ban'),
					$banForm
						.on('submit', event => {
							event.preventDefault();
							// Prepare to append the ban message.
							const $showMessage = $banForm
								.find('[name="public_message"]:checked')
								.first();
							const $banMessage = $banForm
								.find('[name="message"]')
								.first();
							submitAction(url, $banForm)
								.then(() => retract($banForm.closest('.ban-fields')), reject)
								.then(() => {
									if (($banMessage.length + $showMessage.length) > 1)
										$('<span />')
											.hide()
											.fadeIn()
											.html('('+$banMessage.val()+')')
											.addClass('public_ban')
											.appendTo(get_post_body($post));
									resolve();
							});
					})).appendTo($post)
					.hide()
					.animate({
						margin: 'show',
						padding: 'show',
						height: 'show',
						opacity: 'show'
					});
			});

			function retract($target) {
				return new RSVP.Promise(resolve => {
					$target.animate({
						margin: 'hide',
						padding: 'hide',
						height: 'hide',
						opacity: 'hide'
					}, 'slow', 'swing', resolve);
				}).then(() => $target.remove());
			}
		});
}