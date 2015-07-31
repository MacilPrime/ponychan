/**
 * post-controls
 *
 * Events binded to default tinyboard moderation controls.
 *
 */
import $ from 'jquery';
import RSVP from 'rsvp';
import {pop} from '../main/notice';
import {get_post_num} from '../main/post-info';

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
						$post.children('.controls')
							.addClass('dead-buttons')
							.each(function() {
								$(this).text($(this).text());
							});
						// Disable all mod buttons.
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
						pop('File for post no. '+get_post_num($post)+' has been removed.', 5);
						$(evt.target).remove(); // this button is no longer needed.
					});
				break;
			default:
				redirect();
		}
		function redirect() {
			window.location = evt.target.href;
		}
	}
});

function submitAction(url) {
	return new RSVP.Promise((resolve, reject) => {
		$.get(url).done(data => {
				if ((/<title>Error<\/title>/).test(data)) {
					alert("Error: "+$(data).find("h2").first().text());
					reject();
				} else {
					resolve(data);
				}
			}).fail((xhr, status, err) => {
				alert("Error: "+xhr.status+' '+err);
				reject();
			})
	})
}