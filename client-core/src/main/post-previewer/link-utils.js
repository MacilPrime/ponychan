const $ = require('jquery');
const Kefir = require('kefir');
import {Metadata} from './url-metadata';
import {get_post_num, get_post_board} from '../post-info';

export function onPostLinkEvent(evtName, callback) {
	return Kefir.stream(emitter => {
		function listener(event) {
			emitter.emit({
				$link: $(event.target).closest('a.postlink'),
				event
			});
		}
		$(document).on(evtName, 'a.postlink', listener);
		return () => {
			$(document).off(evtName, 'a.postlink', listener);
		};
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

		// give the proper links the dashed underline
		$post.find('a').filter((i, anchor) =>
			new RegExp(linkText).test($(anchor).text())
		).each((i, postlink) =>
			$(postlink).addClass('parent-link')
		);
	}
}
