/*
 * postlink-info.js
 *
 * Adds " (OP)" to >>X links when the OP is quoted.
 * Adds " (You)" to >>X links when the user is quoted.
 *
 */

(function(exports) {
	settings.newSetting("link_show_you", "bool", true, 'Show "(You)" on links to your posts', 'links', {orderhint:6, moredetails:"Requires Quick Reply dialog to work."});
	
	var myposts = [];
	exports.myposts = myposts;
	
	function loadMyPosts() {
		if (window.sessionStorage && sessionStorage.myposts)
			myposts = JSON.parse(sessionStorage.myposts);
	}
	function saveMyPosts() {
		if (window.sessionStorage)
			sessionStorage.myposts = JSON.stringify(myposts);
	}
	loadMyPosts();
	
	function descLinks() {
		var $thread;
		if ($(this).hasClass('thread'))
			$thread = $(this);
		else
			$thread = $(this).parents('.thread').first();
		
		if (!$thread.length) {
			if ($('.thread').length == 1)
				$thread = $('.thread');
			else
				return;
		}
		
		var $OP = $thread.find('div.post.op');
		var OP = get_post_num($OP);
		var board = get_post_board($OP);
		
		$(this).find('a.bodylink.postlink').each(function() {
			var postnum;
			
			if(postnum = $(this).text().match(/^>>(\d+)/))
				postnum = parseInt(postnum[1]);
			else
				return;
			
			if (postnum == OP && !$(this).children(".opnote").length) {
				$(this).append( $('<span/>').addClass('opnote').text(' (OP)') );
			}
			
			var postid = board+':'+postnum;
			if (myposts.indexOf(postid) != -1 && !$(this).children(".younote").length) {
				$(this).append( $('<span/>').addClass('younote').text(' (You)') );
			}
		});
	}
	
	function updateLinkInfo() {
		var $info_style = $("style#link_info_style");
		if (!$info_style.length) {
			$info_style = $("<style/>")
				.attr("id", "link_info_style")
				.attr("type", "text/css")
				.appendTo(document.head);
		}
		if (settings.getSetting("link_show_you")) {
			$info_style.text("");
		} else {
			$info_style.text(".younote { display: none; }");
		}
	}

	$(document).on('post_submitted', function(e, info) {
		loadMyPosts();
		myposts.push(info.board+':'+info.postid);
		saveMyPosts();
	}).ready(function() {
		updateLinkInfo();
		
		$('.thread').each(descLinks);
		
		$(document).on('new_post', function(e, post) {
			$(post).each(descLinks);
		}).on("setting_change", function(e, setting) {
			if (setting == "link_show_you")
				updateLinkInfo();
		});
	});
})(window.postlinkinfo||(window.postlinkinfo={}));
