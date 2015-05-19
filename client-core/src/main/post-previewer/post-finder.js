import $ from 'jquery';
import RSVP from 'rsvp';
import _ from 'lodash';
import {Metadata} from './url-metadata';
import {clearAllInline} from './post-inline';
import settings from '../settings';

export function findPost(url) {

	const message = text => $('<div />').addClass('body bodynote').append(text);
	const meta = new Metadata(url);
	const $container = $('<div/>')
		.data('dummy', 'loading')
		.append(message('Loading...'))
		.addClass([
			'dummy', 'post', 'reply',
			meta.toQuerySelector().replace('.', ''),
			'post_'+meta.post
		].join(' '));

	new RSVP.Promise((resolve, reject) => {

		// attempt to query the document for this post.
		const $foundPost = $(meta.toQuerySelector()).first();
		if ($foundPost.length > 0) {
			// this is synchronous
			resolve($foundPost.clone());
		} else {
			// this is asynchronous
			loadPost(url, $loadPost => {
				if ($loadPost instanceof $) resolve($loadPost);
				else reject($loadPost)
			})
		}

	}).then($retrievedPost => {

			const $clone = $retrievedPost.clone();
			// fill the container with the post's contents. or,
			// fill it with a warning message.
			$container.html(() => {
				const noped = _.negate(settings.getSetting);

				if (noped('show_mature') && $clone.hasClass('mature_post'))
					return message('This linked post is in a mature content thread, '+
					'and viewing mature content threads is currently disabled.');

				if (noped('reveal_spoiler_threads') && $clone.hasClass('spoiler_post'))
					return message([
						$('<p />').text('This post is from a spoilered thread.'),
						$('<a />').text('[View thread]')
							.addClass('spoilerviewlink')
							.attr('href', url)
					]);

				if ($clone.data('filtered'))
					return message('This linked post is filtered.');

				return $clone.children();
			}).addClass($clone.attr('class'))
				.removeClass('post-loading post-preview dummy highlighted')
				.removeAttr('id')
				.find('[id], .expanded')
				.removeAttr('id')
				.removeClass('expanded');

			// Clear out inline containers from the clone.
			clearAllInline($container);
			if ($container.find('.bodynote').length == 0)
				$container.trigger('new_post', $container.get(0))

		}).catch(error => $container.html(message(error)));

	return $container;
}



const threadCache = {};
// Later, this populates with jQuery promise objects.

function loadPost(targetURL, callback) {
	// Performs ajax requests to get posts from external pages.
	// 1st param - URL, including hash.
	// 2nd param - Callback, with the inserted post in its parameter.
	const meta = new Metadata(targetURL);
	const threadURL = targetURL.replace(/#.*$/, '');

	// https://learn.jquery.com/code-organization/deferreds/examples/
	if (_.isUndefined(threadCache[threadURL])) {
		// When it's undefined, it's a page we haven't loaded yet.

		threadCache[threadURL] = $.Deferred(
			// Point all callbacks of the same url to the corresponding promise.
				dfr => $.ajax(threadURL, {cache: false}).then(dfr.resolve, dfr.reject)
		).promise();
	}

	threadCache[threadURL].done((data, textStatus, jqXHR) => {
		const $postC = $(data).find('#replyC_'+meta.post);
		const isOK = (/^0|200|304$/).test(jqXHR.status);

		if (isOK && $postC.length == 0) {
			delete threadCache[targetURL];
			callback('This post was either pruned or deleted.');

		} else if (isOK) {

			// Drop a clone of the post in the document body.
			const $cloneC = $postC.clone()
				.addClass('preview-hidden')
				.removeAttr('id')
				.appendTo(document.body);
			const $cloneP = $cloneC.children('.post')
				.addClass('post-preview');

			// check if the parent thread is a spoiler.
			_.filter($postC.closest('.thread').find('.op .hashtag'),
					self => /^#Spoiler$/.test($(self).text())).forEach(
				() => $cloneP.addClass('spoiler_post'));

			$(document).trigger('new_post', $cloneP[0]);
			$cloneC.find('[id]').removeAttr('id');
			callback($cloneP);

		} else {
			callback('Error: '+$(data).find('h2').first().text());
		}
	}).fail((xhr, status, err) => callback(xhr.status+' '+err))
}