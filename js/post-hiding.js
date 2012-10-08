/*
 * qr.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/post-hiding.js';
 *
 */

$(document).ready(function(){
	settings.newProp("show_hide_buttons", "bool", false, "Show post hiding buttons");

	function init_hide_style() {
		var $hide_style = $("style#hide_button_style");
		if (!$hide_style.length) {
			$hide_style = $("<style/>")
				.attr("id", "hide_button_style")
				.attr("type", "text/css")
				.appendTo(document.head);
		}
		if (settings.getProp("show_hide_buttons")) {
			$hide_style.text("");
		} else {
			$hide_style.text(".postSide .hide_button { display: none; }");
		}
	}
	init_hide_style();
	
	$(document).on("setting_change", function(e, setting) {
		if (setting == "show_hide_buttons")
			init_hide_style();
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

	var path_board_regex = new RegExp(siteroot+"([^/]+)/");
	var board_id = null;
	var reg_result = path_board_regex.exec(document.location.pathname);
	if (reg_result) {
		board_id = reg_result[1];
	} else {
		var href_board_regex = new RegExp("\\?/([^/]+)/");
		reg_result = href_board_regex.exec(document.location.href);
		if (reg_result) {
			board_id = reg_result[1];
		}
	}
	
	function get_post_board($postC) {
		var $post_no = $postC.find(".post_no:first");
		var no_board_regex = new RegExp("^\\??"+siteroot+"([^/]+)/res/\\d+");
		var reg_result = no_board_regex.exec($post_no.attr("href"));
		if (reg_result) {
			return reg_result[1];
		} else {
			// If the No. button didn't have the board
			// name in its link, then the post belongs to
			// the current page's board.
			return board_id;
		}
	}

	function do_hide_post($postC) {
		var prefix = "";
		if ($postC.hasClass("opContainer")) {
			var $thread = $postC.parent(".thread");
			$thread.find(".replyContainer").hide();
			prefix = "Thread hidden - ";
		}

		$postC.children(".post, .postSide").hide();
		$postC.find(".postStub").remove();
		var $intro = $postC.find(".intro:first");
		var name = $intro.find(".name").text() + $intro.find(".trip").text();
		
		var $stub = $("<div/>")
			.addClass("postStub")
			.addClass("hide_button")
			.appendTo($postC);
		var $stubLink = $("<a/>")
			.attr("href", "javascript:void(0);")
			.prependTo($stub)
			.text("[ + ] "+prefix+name)
			.click(show_this_post);
	}

	hide_post = function(board, postnum) {
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
			$thread.find(".replyContainer").show();
		}

		$postC.find(".postStub").remove();
		$postC.children(".post, .postSide").show();
	}

	show_post = function(board, postnum) {
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
		hide_post(get_post_board($pc), postnum);
	}

	function show_this_post() {
		var $pc = $(this).parents(".postContainer").first();
		var postnum = /replyC_(\d+)/.exec($pc.attr("id"))[1];
		show_post(get_post_board($pc), postnum);
	}

	function process_posts(context) {
		var $pcs = $(context).filter(".postContainer").add( $(".postContainer", context) );
		$pcs.each(function() {
			var $pc = $(this);
			if (!$pc.attr("id"))
				return;
			
			// Don't hide a thread if we're trying to view
			// it specifically.
			if ($pc.hasClass("opContainer") && $('div.banner').length)
				return;
			
			place_button($pc);
			var postnum = /replyC_(\d+)/.exec($pc.attr("id"))[1];
			if (is_post_hidden(get_post_board($pc), postnum)) {
				do_hide_post($pc);
			}
		});
	}

	function place_button($pc) {
		var $side = $pc.children(".postSide");
		if (!$side.length) {
			$side = $("<div/>")
				.addClass("postSide")
				.prependTo($pc);
		}
		var $hide_button = $side.find("a.hide_button");
		if (!$hide_button.length) {
			$hide_button = $("<a/>")
				.addClass("hide_button")
				.attr("href", "javascript:void(0);")
				.prependTo($side);
		}
		$hide_button
			.text("[ - ]")
			.click(hide_this_post);
	}

	process_posts(document);
	$(document).bind('new_post', function(e, post) {
		if ($(post).parent().hasClass("postContainer"))
			process_posts($(post).parent());
	});
});
