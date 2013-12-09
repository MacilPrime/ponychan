/*
 * notifier.js
 *
 * Notifies user of replies to them in open threads
 *
 * Must be loaded after postlinkinfo.js
 *
 */

(function(exports) {
	settings.newSetting("reply_notify", "bool", true, "Enable Reply Notifier Sound", 'links', {orderhint:7, moredetails:"Audibly alert you when a post by you in a thread you're viewing is replied to."});

	var soundChoices = {
		default: "Default",
		aim: "AIM"
	};

	settings.newSetting("reply_notify_sound", "select", "default", "Reply Notifier Sound Choice", 'links', {orderhint:7.5, moredetails:'<a href="javascript:notifier.playSound()">Test Sound</a>', moredetails_rawhtml:true, selectOptions: soundChoices});
	
	var $au;
	function prepareNotifySound() {
		$au = $("audio#notify_sound");
		if (!$au.length) {
			$au = $("<audio/>")
				.attr("id", "notify_sound")
				.appendTo(document.body);
		}
		switch (settings.getSetting("reply_notify_sound")) {
		case "aim":
			$au.empty().append(
				$("<source/>").attr({src:siteroot+"static/notify_imrcv.ogg", type:"application/ogg"}),
				$("<source/>").attr({src:siteroot+"static/notify_imrcv.mp3", type:"audio/mpeg"})
			);
			break;
		case "default":
		default:
			$au.empty().append(
				$("<source/>").attr({src:siteroot+"static/notify.ogg", type:"application/ogg"}),
				$("<source/>").attr({src:siteroot+"static/notify.mp3", type:"audio/mpeg"})
			);
		}
		$au[0].load();
	}
	
	function playSound() {
		$au[0].play();
	}
	exports.playSound = playSound;
	
	var $unseenPosts = $();
	var scrollHandlerInstalled = false;
	var pendingScrollHandler = null;
	
	// Sets the title to show the number of unread replies to the
	// user, and installs or removes the scroll handler to keep it
	// up-to-date as needed.
	function updateTitle() {
		if ($unseenPosts.length == 0) {
			titlebar.removeTitleFlash('notifier');
			if (scrollHandlerInstalled) {
				scrollHandlerInstalled = false;
				$(window).off('scroll.notifier');
			}
		} else {
			var replymsg;
			if ($unseenPosts.length == 1)
				replymsg = 'reply';
			else
				replymsg = 'replies';
			
			titlebar.setTitleFlash('notifier', '('+$unseenPosts.length+' '+replymsg+')');
			if (!scrollHandlerInstalled) {
				scrollHandlerInstalled = true;
				$(window).on('scroll.notifier', function(event) {
					if(pendingScrollHandler)
						return;
					pendingScrollHandler = setTimeout(scrollHandler, 100);
				});
			}
		}
	}
	
	function scrollHandler() {
		while($unseenPosts.length > 0) {
			var $post = $($unseenPosts[0]);
			if($post.is(":visible")) {
				var postBottom = $post.offset().top+$post.height();
				var screenBottom = $(window).scrollTop()+$(window).height();
				if(postBottom > screenBottom)
					break;
			}
			$unseenPosts = $unseenPosts.slice(1);
		}
		updateTitle();
		pendingScrollHandler = null;
	}
	
	function notifyCheck($post) {
		// Only run for actually new autoloaded posts
		if ($post.is(".preview-hidden, .post-hover, .post-inline") ||
		    $post.parent().is(".preview-hidden") ||
		    $post.parents('.thread').first().attr("data-loaded-late"))
			return;
		if ($post.find('.younote').length == 0)
			return;
		// Okay, this post is a brand new reply to you
		if (settings.getSetting("reply_notify"))
			playSound();
		$unseenPosts = $unseenPosts.add($post);
		updateTitle();
	}
	
	$(document).ready(function() {
		prepareNotifySound();
		
		$(document).on("setting_change.notifier", function(e, setting) {
			if (setting == "reply_notify_sound")
				prepareNotifySound();
		}).on('new_post.notifier', function(e, post) {
			notifyCheck($(post));
		});
	});
})(window.notifier||(window.notifier={}));
