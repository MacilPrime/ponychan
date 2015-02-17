/*
 * titlebar.js
 *
 * Released under the MIT license
 * Copyright (c) 2014 Macil Tech <maciltech@gmail.com>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/postlinkinfo.js';
 *   $config['additional_javascript'][] = 'js/titlebar.js';
 *
 */

import $ from 'jquery';
import {get_post_id} from './post-info';

var flash = {};
var flashmessage = '';

// Temporary dummy function. Gets replaced later.
var updateTitle = function() {};

function updateTitleFlash() {
	flashmessage = '';
	$.each(flash, function(i, val) {
		flashmessage += val + ' ';
	});
	updateTitle();
}

function setTitleFlash(key, message) {
	flash[key] = message;
	updateTitleFlash();
}
exports.setTitleFlash = setTitleFlash;

function removeTitleFlash(key) {
	delete flash[key];
	updateTitleFlash();
}
exports.removeTitleFlash = removeTitleFlash;

$(document).ready(function() {
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

	var $unseenPosts = $(".thread .post.reply").not(".preview-hidden, .post-hover, .post-inline");

	var pendingScrollHandler = null;

	updateTitle = function() {
		var newTitle = flashmessage + "("+$unseenPosts.length+") "+mainTitle;
		if(document.title != newTitle)
			document.title = newTitle;
	};

	function scrollHandler() {
		pendingScrollHandler = null;

		// If the page is hidden, we don't want to decrement the unseenPosts count yet,
		// so that way the tab title is accurate.
		if (Visibility.hidden())
			return;

		var seenPosts = [];
		while($unseenPosts.length > 0) {
			var $post = $($unseenPosts[0]);
			if($post.is(":visible")) {
				var postBottom = $post.offset().top+$post.height();
				var screenBottom = $(window).scrollTop()+$(window).height();
				if(postBottom > screenBottom)
					break;
			}
			seenPosts.push(get_post_id($post));
			$unseenPosts = $unseenPosts.slice(1);
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
		if (postlinkinfo.myposts.indexOf( get_post_id($post) ) != -1)
			return;
		$(document).trigger('new_unseen_post', post);
		$unseenPosts = $unseenPosts.add(post);
		updateTitle();
	});
});
