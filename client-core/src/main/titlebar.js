/*
 * titlebar.js
 *
 * Released under the MIT license
 * Copyright (c) 2014 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import myPosts from './my-posts';
import {get_post_id} from './post-info';

var flash = {};
var flashmessage = '';
export const unseenPosts = new Map();

// Temporary dummy function. Gets replaced later.
var updateTitle = function() {};

function updateTitleFlash() {
	flashmessage = '';
	$.each(flash, function(i, val) {
		flashmessage += val + ' ';
	});
	updateTitle();
}

export function setTitleFlash(key, message) {
	flash[key] = message;
	updateTitleFlash();
}

export function removeTitleFlash(key) {
	delete flash[key];
	updateTitleFlash();
}

$(document).ready(function() {
	const $icon = $('head link[rel="shortcut icon"]');

	if($('div.banner').length == 0)
		return; // not index

	var titlePrefix = document.title.split("-")[0]+"- ";
	var titleSplit = document.title.split("-");
	if (titleSplit.length < 2)
		return;
	var titleEnd = titleSplit[1].slice(1);

	var opsubject = $(".post.op .subject").text().trim();
	if(opsubject) {
		titleEnd = opsubject;
	} else {
		var optext = $(".post.op .body").text().trim();
		if(optext) {
			if(optext.length > 20)
				titleEnd = optext.slice(0,20)+"...";
			else
				titleEnd = optext;
		}
	}

	var mainTitle = titlePrefix+titleEnd;
	$(".thread .post.reply" +
		":not(.preview-hidden)" +
		":not(.preview-hover)" +
		":not(.post-inline)")
		.each((i, post) => {
			const $post = $(post);
		 unseenPosts.set(get_post_id($post), $post)
	});

	var pendingScrollHandler = null;

	updateTitle = function() {
		const newTitle = flashmessage + "("+unseenPosts.size+") "+mainTitle;
		if (document.title != newTitle) {
			document.title = newTitle;
		}
		const icon = unseenPosts.size ? SITE_DATA.url_favicon_alert : SITE_DATA.url_favicon;
		if ($icon.attr('href') !== icon) {
			$icon.attr('href', icon);
		}
	};

	function scrollHandler() {
		pendingScrollHandler = null;

		// If the page is hidden, we don't want to decrement the unseenPosts count yet,
		// so that way the tab title is accurate.
		if (Visibility.hidden())
			return;

		var seenPosts = [];
		for (let id of Array.from(unseenPosts.keys()).sort()) {
			let $post = unseenPosts.get(id);
			if ($post.is(":visible")) {
				let postBottom = $post.offset().top + $post.height();
				let screenBottom = $(window).scrollTop() + $(window).height();
				if (postBottom > screenBottom)
					break;
			}
			seenPosts.push(id);
			unseenPosts.delete(id);
		}
		updateTitle();
		if (seenPosts.length)
			$(document).trigger('posts_seen', {
				posts: seenPosts
			});
	}
	$(window).scroll(function(event) {
		if(pendingScrollHandler)
			return;
		pendingScrollHandler = setTimeout(scrollHandler, 100);
	});

	Visibility.change(scrollHandler);

	scrollHandler();

	$(document).on('new_post', function(e, post) {
		var $post = $(post);
		// Don't increase the counter for post previews
		if ($post.is(".preview-hidden, .post-hover, .post-inline") || $post.parent().is(".preview-hidden"))
			return;
		// Or for posts the user made themselves.
		if (myPosts.contains(get_post_id($post)))
			return;
		$(document).trigger('new_unseen_post', post);
		unseenPosts.set(get_post_id($post), $post);
		updateTitle();
	});
});
