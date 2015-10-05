import $ from 'jquery';
import {Metadata} from './url-metadata';
import {findPost} from './post-finder';
import {onPostLinkEvent, markParentLinks} from './link-utils';
import {jumpToPost} from '../post-utils';
import settings from '../settings';


settings.newSetting('preview_inline',
	'bool', true,
	'Preview post inline on link click', 'links',
	{orderhint: 1});


function init() {
	onPostLinkEvent('click', evt => {

		const url = evt.target.getAttribute('href');
		const $post = findPost(url);

		if (evt.which !== 2 && !evt.ctrlKey && !evt.shiftKey) {
			// don't highlight when the user is opening the link in
			// a new window.
			let meta = new Metadata(url);
			if (settings.getSetting('preview_inline'))
				toggleInline(evt, $post);
			else
				jumpToPost(meta.board+':'+meta.post);
		}
	});
	$(document).on('setting_change', () => {
		// Remove all inline posts if turned off.
		if (!settings.getSetting('preview_inline'))
			clearAllInline();
	});
}


function toggleInline(evt, $post) {
	evt.preventDefault();
	const meta = new Metadata(evt.target.getAttribute('href'));
	const $link = $(evt.target);
	if (!$link.hasClass('parent-link')) {

		// Determining reference frame for the bin's position differs
		// depending on whether the links are in the header or not.
		const $before = $link.hasClass('backlink') ? $link.closest('.intro') : $link;

		const getOrCreateWrap = function() {
			if ($before.next().hasClass('inline-wrap'))
				return $before.next();
			else
				return $('<div />')
					.addClass('inline-wrap')
					.insertAfter($before);
		};

		if ($link.hasClass('inlined')) {
			// for backlinks, drop posts in after the parent
			$link.removeClass('inlined');

			let $cont = getOrCreateWrap();
			$cont.children(meta.toQuerySelector()).remove();
			if ($cont.children().length == 0)
				$cont.remove();

		} else {
			$link.addClass('inlined');
			$post.addClass('post-inline')
				.on('new_post', (e, post) => {
					markParentLinks($post, $link);

					// Give inline posts a link to make it easy
					// to navigate on a mobile device.
					const $permalink = $link
						.closest('.post')
						.find('.permalink')
						.first();
					if ($permalink.length > 0 && $link.hasClass('bodylink')) {
						let parentMeta = new Metadata($permalink.get(0).getAttribute('href'));
						if (meta.thread != parentMeta.thread) {
							let $intro = $(e.currentTarget).find('.intro').first();
							$intro.find('.threadviewlink').remove();
							$intro.append($('<a />')
								.text('[View]')
								.attr('href', evt.target.getAttribute('href'))
								.addClass('threadviewlink'));
						}
					}
				}).prependTo(getOrCreateWrap());

		}
	}
}


export function clearAllInline($context) {
	$('.inlined', $context).removeClass('inlined');
	$('.inline-wrap', $context).remove();
}

init();
