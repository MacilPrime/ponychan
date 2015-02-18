/*
 * notifier.js
 *
 * Notifies user of replies to them in open threads
 *
 * Released under the MIT license
 * Copyright (c) 2014 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import settings from './settings';
import {log_error} from './logger';
import * as titlebar from './titlebar';
import {get_post_id} from './post-info';

settings.newSetting("reply_notify", "bool", true, "Enable Reply Notifier Sound", 'links', {
	orderhint: 7,
	moredetails: "Audibly alert you when a post by you in a thread you're viewing is replied to."
});

var soundChoices = {
	main: "Default",
	aim: "AIM",
	yeah: "Yeah!"
};

settings.newSetting("reply_notify_sound", "select", "main", "Reply Notifier Sound Choice", 'links', {
	orderhint: 7.5,
	moredetails: $("<button/>")
		.text("Test sound")
		.click(playSound),
	moredetails_rawhtml: true,
	selectOptions: soundChoices,
	defpriority: 0
});

var $au;
function prepareNotifySound() {
	$au = $("audio#notify_sound");
	if (!$au.length) {
		$au = $("<audio/>")
			.attr("id", "notify_sound")
			.appendTo(document.body);
	} else {
		$au.empty();
	}
	switch (settings.getSetting("reply_notify_sound")) {
	case "aim":
		$au.append(
			$("<source/>").attr({src:siteroot+"static/notify_imrcv.ogg", type:"audio/ogg"}),
			$("<source/>").attr({src:siteroot+"static/notify_imrcv.mp3", type:"audio/mpeg"})
		);
		break;
	case "yeah":
		$au.append(
			$("<source/>").attr({src:siteroot+"static/notify_yeah.ogg", type:"audio/ogg"}),
			$("<source/>").attr({src:siteroot+"static/notify_yeah.mp3", type:"audio/mpeg"})
		);
		break;
	//case "main":
	default:
		$au.append(
			$("<source/>").attr({src:siteroot+"static/notify.ogg", type:"audio/ogg"}),
			$("<source/>").attr({src:siteroot+"static/notify.mp3", type:"audio/mpeg"})
		);
	}
	try {
		if ($au[0].load)
			$au[0].load();
	} catch(e) {
		log_error(e);
	}
}

function playSound() {
	$au[0].play();
}
exports.playSound = playSound;

var unseenReplies = [];

// Sets the title to show the number of unread replies to the
// user.
function updateTitle() {
	if (unseenReplies.length == 0) {
		titlebar.removeTitleFlash('notifier');
	} else {
		var replymsg;
		if (unseenReplies.length == 1)
			replymsg = 'reply';
		else
			replymsg = 'replies';

		titlebar.setTitleFlash('notifier', '('+unseenReplies.length+' '+replymsg+')');
	}
}

function notifyCheck($post) {
	if ($post.find('.younote').length == 0)
		return;
	// Okay, this post is a brand new reply to you
	if (settings.getSetting("reply_notify"))
		playSound();
	unseenReplies.push(get_post_id($post));
	updateTitle();
}

$(document).ready(function() {
	prepareNotifySound();

	$(document).on("setting_change.notifier", function(e, setting) {
		if (setting == "reply_notify_sound")
			prepareNotifySound();
	}).on('new_unseen_post.notifier', function(e, post) {
		notifyCheck($(post));
	}).on('posts_seen.notifier', function(e, data) {
		var changed = false;
		var posts = data.posts;
		for (var i=0; i<posts.length; i++) {
			if (!unseenReplies.length)
				break;

			var ri = unseenReplies.indexOf(posts[i]);
			if (ri != -1) {
				unseenReplies.splice(ri, 1);
				changed = true;
			}
		}
		if (changed)
			updateTitle();
	});
});
