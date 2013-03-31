/*
 * show-op
 * https://github.com/savetheinternet/Tinyboard/blob/master/js/show-op.js
 *
 * Adds "(OP)" to >>X links when the OP is quoted.
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/show-op.js';
 *
 */

$(document).ready(function(){
	var myposts = [];
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
			
			if (postnum == OP && !$(this).hasClass("opnote")) {
				$(this).addClass('opnote').text( $(this).text()+' (OP)');
			}
			
			var postid = board+':'+postnum;
			if (myposts.indexOf(postid) != -1 && !$(this).hasClass("younote")) {
				$(this).addClass('younote').text( $(this).text()+' (You)');
			}
		});
	}
	
	$('.thread').each(descLinks);
	
	$(document).on('new_post', function(e, post) {
		$(post).each(descLinks);
	}).on('post_submitted', function(e, info) {
		loadMyPosts();
		myposts.push(info.board+':'+info.postid);
		saveMyPosts();
	});
});
