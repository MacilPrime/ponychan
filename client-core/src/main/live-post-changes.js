/**
 * find-deleted-posts
 *
 *
 */
import $ from 'jquery';
import _ from 'lodash';
import RSVP from 'rsvp';
import {get_post_body} from './post-info';

function init() {
	$(document).ready(function() {
			// Clean up existing controls that are stray on the page
		$('.old-editmsg').removeClass('old-editmsg');
		$('.new-editmsg').remove();
	});
	$(document).on('thread_reloaded', (evt, data) => {
		let $data = $('<div />').append(data);
		if ($data.children().length > 1) {
			// check to make sure that this isn't that dummy banner.
			list.populate($data);
			_.forEach(action, func => {func()})
		}
	})
}

const list = {
	matchesBoth(id) {
		if (!this.currentPosts.hasOwnProperty(id))
			return false;
		return this.dataPosts.hasOwnProperty(id);
	},
	prune(id) {
		delete this.currentPosts[id];
		delete this.dataPosts[id];
	},
	currentPosts: {},
	dataPosts: {},
	populate($data) {
		// Fills the properties above with a collection of posts
		// in the notation of {'reply_40000000': [HTMLElement Post], ...}
		function createPostCollection($context) {
			const collection = {};
			$('.postContainer' +
				':not(.post-inline-container)' +
				':not(.preview-hidden)', $context)
				.children('.post')
				.filter(':not([data-deleted])')
				.each(function() {
					// Populate the collection object
					// with posts indiscriminately.
					collection[this.id] = this;
				});
			return collection;
		}
		this.currentPosts = createPostCollection($(document));
		this.dataPosts = createPostCollection($data);

		if (/\+50\.html/.test(document.URL)) {
			// When a '+50' version of the thread is opened, we have nothing
			// to compare with our current post stack until we find our
			// first matching post. This is a subtractive process.
			_.forOwn(this.currentPosts, (post, id) => {
				if ($(post).is('.op'))
					return true; // The OP doesn't count.
				if (this.matchesBoth(id))
					return false; // break the loop.
				else
					this.prune(id);
				return true;
			});
		}

		_.forOwn(this.dataPosts, (post, id) => {
			// This is for all of the new posts that also have nothing
			// to compare with yet.
			if (!this.matchesBoth(id))
				this.prune(id);
		})
	}
};


const action = {
	findDeletedPosts() {
		_.forOwn(list.currentPosts, (post, id) => {
			if (!list.matchesBoth(id)) {
				const $post = $(post)
					.data('deleted', 'deleted');
				const $intro = $post
					.find('.intro')
					.first();
				$intro.find('.permalink').remove();
				$intro.find('input').prop('disabled', true);
				$intro.find('.citelink').replaceWith(
					$('<span />')
						.addClass('removedpost')
						.text('[Removed]')
				);
			}
		});
		return list;
	},
	markPostsAsEdited() {
		_.forOwn(list.dataPosts, (newPost, id) => {
			// Look for edited posts in the new page first.
			$(newPost).find('.editmsg time').each(function() {
				if (id in list.currentPosts) {
					let $oldPost = $(list.currentPosts[id]);
					let $oldTime = $oldPost
						.find('.editmsg:not(.old-editmsg) time')
						.last();
					// the significance of 'last()' is that it avoids the
					// selector from wrongly selecting an inline post.
					if ($oldTime.length > 0) {
						// We're presented with an existing edit. Does the
						// new page present an even newer edit?
						let oldTS = Date.parse($oldTime.attr('datetime'));
						let newTS = Date.parse($(this).attr('datetime'));
						if (newTS > oldTS)
							presentNewEdit($oldPost, $(newPost));
					} else {
						// If it started out with no edit, then any
						// presented edit is new to us.
						presentNewEdit($oldPost, $(newPost))
					}
				}
			});
			function presentNewEdit($oldPost, $newPost) {
				let $oldBody = get_post_body($oldPost);
				let $newBody = get_post_body($newPost)
					.addClass('hidden-new-edit')
					.insertAfter($oldBody);

				$oldBody.children('.editmsg').addClass('old-editmsg');

				$('<div />')
					.addClass('editmsg new-editmsg')
					.append(
						'This post has a new edit.',
						$('<button />')
							.text('Reveal')
							.addClass('edit-revealer')
							.click(evt => {
								evt.preventDefault();
								$oldBody
									.replaceWith(
									$newBody.removeClass('hidden-new-edit')
								);
								// Reset all events
								$oldPost.html($oldPost.html());
								$(document).trigger('new_post', $oldPost);
							})
				).appendTo($oldBody);
			}
		});
	}


};


init();