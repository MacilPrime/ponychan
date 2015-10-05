const Kefir = require('kefir');
import $ from 'jquery';
import udKefir from 'ud-kefir';
import {findPost} from './post-finder';
import {onPostLinkEvent, markParentLinks} from './link-utils';
import settings from '../settings';

settings.newSetting('preview_hover',
	'bool', true,
	'Preview post on link hover', 'links',
	{orderhint: 2});

const update = udKefir(module, null).changes().take(1).toProperty();

function init() {
	onPostLinkEvent('mouseenter')
		.takeUntilBy(update)
		.filter(() => settings.getSetting('preview_hover'))
		.filter(({$link}) => !$link.hasClass('inlined'))
		.onValue(({$link}) => {
			const $post = findPost($link.attr('href'));
			startHover($link, $post);
			const end = Kefir.merge([
					Kefir.fromEvents($link[0], 'mouseleave'),
					Kefir.fromEvents($link[0], 'click')
				]);
			Kefir.fromEvents($link, 'mousemove')
				.takeUntilBy(end)
				.onValue(event => {
					midHover(event, $post);
				})
				.onEnd(() => {
					$post.remove();
				});
		});
}

function startHover($link, $post) {
	$post.addClass('post-hover reply')
		.on('new_post', () => markParentLinks($post, $link))
		.appendTo(document.body);
	$link.trigger('mousemove');
	// trigger mid hover to set a position.
}

function midHover(evt, $post) {
	// calculate the window dimensions *only once*.
	const windowWidth = $(window).width();
	const windowHeight = $(window).height();

	// default coordinates on right
	const xy = Object.seal({
		left: evt.clientX + 25,
		right: 'auto',
		top: evt.clientY - 40,
		bottom: 'auto'
	});
	// flip to left
	const leftSideOfPage = windowWidth / 2;
	if (evt.clientX > leftSideOfPage) {
		xy.right = windowWidth - evt.clientX + 25;
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
