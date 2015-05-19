import $ from 'jquery';
import _ from 'lodash';
import {Metadata} from './url-metadata';
import {get_post_num, get_post_board} from '../post-info';

export function onPostLinkEvent(evtName, callback) {
	// Event delegation. We can't use mousemove here because it
	// would result in memory leaks.
	$(document).on(evtName, '.postlink', event => {
		if ($(event.target).hasClass('postlink')) {
			callback(event);
		} else {
			event.preventDefault();
			$(event.target).closest('.postlink').trigger(evtName);
			// If the event propagated (likely to the OP/You note),
			// then we go to the parent link and start over.
		}
	});
}

export function markParentLinks($post, $link) {
	const meta = new Metadata($link.get(0).getAttribute('href'));
	const $parent = $link.closest('.post');
	if ($parent.length > 0) {

		const board = get_post_board($parent);
		var linkText;

		//determine whether or not a board match is needed.
		if (board == meta.board || meta.board == undefined)
			linkText = '^>>'+get_post_num($parent)+'\\b';
		else
			linkText = '^>>>/'+board+'/'+get_post_num($parent)+'\\b';

		// check if the parent thread is a spoiler.
		_.filter($post.find('a'),
				self => new RegExp(linkText).test($(self).text())).forEach(
				link => $(link).addClass('parent-link'));
	}
}