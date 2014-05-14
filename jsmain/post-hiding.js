/*
 * qr.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/post-hiding.js';
 *
 */

settings.newSetting("show_mature", "bool", false, "Show mature content threads", 'filters', {moredetails:"Only available on certain boards", orderhint:1});
settings.newSetting("mature_as_spoiler", "bool", false, "Treat mature content images as spoilered images", 'filters', {orderhint:2});
settings.newSetting("show_hide_buttons", "bool", true, "Show post hiding buttons", 'filters', {orderhint:3});

$(document).ready(function(){
	function init_hide_style() {
		if (settings.getSetting("show_hide_buttons"))
			setCss("hide_button", "");
		else
			setCss("hide_button", ".postHider { display: none; }");
	}
	init_hide_style();
	
	function init_mature() {
		var expires = new Date();
		if (settings.getSetting("show_mature")) {
			expires.setTime((new Date).getTime()+60480000000)
			document.cookie = "show_mature=true; expires="+expires.toGMTString()+"; path="+siteroot;
			
			$(".mature_warning").hide();
			$(".mature_thread, .mature_post_button, #setting_mature_as_spoiler").show();
			switch_mature_as_spoiler();
		} else {
			expires.setTime((new Date).getTime()-50000)
			document.cookie = "show_mature=false; expires="+expires.toGMTString()+"; path="+siteroot;
			
			$(".mature_warning").show();
			$(".mature_thread, .mature_post_button, #setting_mature_as_spoiler").hide();
		}
	}
	init_mature();
	
	function prep_mature_images(context) {
		$("img[data-mature-src]", context).each(function() {
			var $img = $(this);
			
			if (!settings.getSetting("mature_as_spoiler")) {
				if ($img.attr("data-spoiler-src") == undefined)
					$img.attr("data-spoiler-src", $img.attr("src"));
				$img.attr("src", $img.attr("data-mature-src"));
				
				if ($img.attr("data-mature-style") != undefined) {
					if ($img.attr("data-spoiler-style") == undefined)
						$img.attr("data-spoiler-style", $img.attr("style"));
					$img.attr("style", $img.attr("data-mature-style"));
				}
			} else {
				if ($img.attr("data-spoiler-src") != undefined)
					$img.attr("src", $img.attr("data-spoiler-src"));
				if ($img.attr("data-spoiler-style") != undefined)
					$img.attr("style", $img.attr("data-spoiler-style"));
			}
		});
	}

	var ofAge = false;
	function switch_mature() {
		if (settings.getSetting("show_mature")) {
			if (window.localStorage && localStorage.getItem("ofAge") == "true") {
				ofAge = true;
			}
			if (!ofAge) {
				if (confirm("You must be at least 18 years of age to continue.\nPush Cancel if you are not.")) {
					ofAge = true;
					try {
						localStorage.setItem("ofAge", "true");
					} catch(e) {}
				} else {
					settings.setSetting("show_mature", false);
				}
			}
		}
		init_mature();
	}

	function switch_mature_as_spoiler() {
		if (settings.getSetting("show_mature")) {
			prep_mature_images(document.body);
		}
	}
	
	$(document).on("setting_change", function(e, setting) {
		if (setting == "show_hide_buttons")
			init_hide_style();
		else if (setting == "show_mature")
			switch_mature();
		else if (setting == "mature_as_spoiler")
			switch_mature_as_spoiler();
	});

	var hidden_posts = [];
	function load_hidden_posts() {
		if (typeof localStorage != "undefined" && localStorage) {
			var try_hidden_posts = JSON.parse(localStorage.getItem("hidden_posts"));
			if (try_hidden_posts)
				hidden_posts = try_hidden_posts;
		}
	}
	load_hidden_posts();

	function save_hidden_posts() {
		if (typeof localStorage != "undefined" && localStorage) {
			try {
				localStorage.setItem("hidden_posts", JSON.stringify(hidden_posts));
			} catch (e) {}
		}
	}

	function do_hide_post($postC) {
		var prefix = "";
		if ($postC.hasClass("opContainer")) {
			var $thread = $postC.parent(".thread");
			$thread.find(".replyContainer, .omitted").hide();
			prefix = "Thread hidden - ";
		}

		$postC.children(".post, .postSide").hide();
		$postC.find(".postStub").remove();
		var $intro = $postC.find(".intro:first");
		var name = $intro.find(".name").text() + $intro.find(".trip").text();
		
		var $stub = $("<div/>")
			.addClass("postStub")
			.appendTo($postC);
		var $stubLink = $("<a/>")
			.attr("href", "javascript:void(0);")
			.prependTo($stub)
			.text("[ + ] "+prefix+name)
			.click(show_this_post);
	}

	function hide_post(board, postnum) {
		var postid = board+":"+postnum;
		load_hidden_posts();
		if (hidden_posts.indexOf(postid) == -1) {
			hidden_posts.unshift(postid);
			save_hidden_posts();
		}
		
		var $postC = $("#replyC_"+postnum);
		do_hide_post($postC);
	};

	function do_show_post($postC) {
		if ($postC.hasClass("opContainer")) {
			var $thread = $postC.parent(".thread");
			$thread.find(".replyContainer, .omitted").show();
		}

		$postC.find(".postStub").remove();
		$postC.children(".post, .postSide").show();
	}

	function show_post(board, postnum) {
		var postid = board+":"+postnum;
		load_hidden_posts();
		var hidden_index = hidden_posts.indexOf(postid);
		if (hidden_index != -1) {
			hidden_posts.splice(hidden_index, 1);
			save_hidden_posts();
		}
		
		var $postC = $("#replyC_"+postnum);
		do_show_post($postC);
	};

	function is_post_hidden(board, postnum) {
		var postid = board+":"+postnum;
		return hidden_posts.indexOf(postid) != -1;
	};

	function hide_this_post() {
		var $pc = $(this).parents(".postContainer").first();
		var postnum = /replyC_(\d+)/.exec($pc.attr("id"))[1];
		hide_post(get_post_board($pc.children(".post")), postnum);
	}

	function show_this_post() {
		var $pc = $(this).parents(".postContainer").first();
		var postnum = /replyC_(\d+)/.exec($pc.attr("id"))[1];
		show_post(get_post_board($pc.children(".post")), postnum);
	}

	function process_posts(context) {
		var threads_needed = 0;
		var $posts = $(context).filter(".post").add( $(".post", context) );
		$posts.each(function() {
			var $post = $(this);

			if ($post.hasClass("mature_post") && settings.getSetting("show_mature")) {
				prep_mature_images($post);
			}
			
			// Don't hide a thread if we're trying to view
			// it specifically.
			if ($post.hasClass("op") && $('div.banner').length)
				return;

			// Everything after this relies on the post
			// being a non-previewed post that has an ID
			// itself.
			if (!$post.attr("id"))
				return;
			
			// Everything following is for regular post
			// hiding functionality, which requires a
			// .postContainer element.
			var $pc = $post.parent();
			if (!$pc.length || !$pc.hasClass("postContainer"))
				return;

			var $thread = $pc.parents(".thread").first();
			
			place_button($post);
			var postnum = /replyC_(\d+)/.exec($pc.attr("id"))[1];
			if (is_post_hidden(get_post_board($pc.children(".post")), postnum)) {
				if ($pc.hasClass("opContainer"))
					threads_needed++;
				do_hide_post($pc);
			} else {
				if ($pc.hasClass("opContainer") && $thread.hasClass("mature_thread") && !settings.getSetting("show_mature"))
					threads_needed++;
				else if ($pc.hasClass("opContainer") && $thread.attr("data-loaded-late"))
					threads_needed--;
			}
		});
		
		// Load more threads onto the page to make up for
		// hidden threads if this is an index page. Only load
		// more threads on page 1 and if a page 2 exists
		var $selected = $(".pages .selected");
		var $nextpage = $selected.next();
		if (threads_needed > 0 && $selected.text() == "1" && $nextpage.text() == "2" && $nextpage.attr("href")) {
			$.ajax({
				url: $nextpage.attr("href"),
				success: function(data) {
					data = mogrifyHTML(data);
					var $threads = $(".thread", data);
					$threads.each(function() {
						var $thread = $(this);
						
						// If this thread already exists on
						// the current page, ignore it.
						if ($("#"+$thread.attr("id")).not(".preview-hidden").length > 0)
							return;
						
						// It would be silly if we just loaded hidden threads onto this
						// page to make up for hidden threads.
						var postnum = /replyC_(\d+)/.exec($thread.find(".opContainer").first().attr("id"))[1];
						if (is_post_hidden(board_id, postnum))
							return;

						// If it's a mature thread and we can't view those, skip it.
						if ($thread.hasClass("mature_thread") && !settings.getSetting("show_mature"))
							return;
						
						$thread.attr("data-loaded-late", true);
						$(".thread").not(".preview-hidden").last().after($thread);
						$thread.find(".post").each(function() {
							$(document).trigger('new_post', this);
						});
						threads_needed--;
						if (threads_needed <= 0)
							return false;
					});
				}
			});
		}
	}

	function place_button($post) {
		var $hider = $post.find(".postHider");
		if (!$hider.length) {
			$hider = $("<span/>")
				.addClass("postHider");
			if ($post.hasClass('op')) {
				var $post_fi = $post.find('.fileinfo');
				var $target = ($post_fi.length) ? $post_fi : $post.find('.intro');
				$target.prepend($hider, ' ');
			} else {
				$post.prepend($hider);
			}
		}
		var $hide_button = $hider.find("a");
		if (!$hide_button.length) {
			$hide_button = $("<a/>")
				.attr("href", "javascript:void(0);")
				.prependTo($hider);
		}
		$hide_button
			.text("[ - ]")
			.click(hide_this_post);
	}

	process_posts(document);
	$(document).on('new_post', function(e, post) {
		process_posts(post);
	});
});
