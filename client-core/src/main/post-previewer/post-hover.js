import $ from 'jquery';
import {Metadata} from './url-metadata';
import {findPost} from './post-finder';
import {onPostLinkEvent, markParentLinks} from './link-utils';
import settings from '../settings';

settings.newSetting('preview_hover',
	'bool', true,
	'Preview post on link hover', 'links',
	{orderhint: 2});


function init() {
	onPostLinkEvent('mouseover', event => {

		if (settings.getSetting('preview_hover')) {

			const $post = findPost(event.target.getAttribute('href'));

			startHover(event, $post);
			$(event.target)
				.on('mousemove', event => midHover(event, $post))
				// follow the mouse.
				.on('mouseout', event => $post.remove())
				// cancel the previous events
				.on('click', event => $post.remove())
				// Get the hovering block out of the way
				.on('mouseout', event => {
					$(event.target).off('mousemove').off('mouseout').off('click')
				});
		}
	});
}


function startHover(evt, $post) {
	const $link = $(evt.target);
	if (!$link.hasClass('inlined')) {

		$post.addClass('post-hover reply')
			.on('new_post', () => markParentLinks($post, $link))
			.appendTo(document.body);
		$link.trigger('mousemove');
		// trigger mid hover to set a position.
	}
}


function midHover(evt, $post) {
	// calculate the window dimensions *only once*.
	const windowWidth = $(window).width();
	const windowHeight = $(window).height();

	// default coordinates on right
	const xy = Object.seal({
		left: evt.clientX + 50,
		right: 'auto',
		top: evt.clientY - 80,
		bottom: 'auto'
	});
	// flip to left
	const leftSideOfPage = windowWidth / 2;
	if (evt.clientX > leftSideOfPage) {
		xy.right = windowWidth - evt.clientX + 50;
		xy.left = 'auto';
	}
	// floor
	const bottom = xy.top + $post.height();
	if (bottom > windowHeight) {
		xy.top = 'auto';
		xy.bottom = 0;
	}
	// ceiling
	const topOfPage = 35; // approximate height of nav bar
	if (xy.top < topOfPage) {
		xy.top = topOfPage;
	}
	$post.css(xy);
}


init();