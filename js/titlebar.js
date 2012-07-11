/*
 * titlebar.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/titlebar.js';
 *
 */

$(document).ready(function(){
	if($('div.banner').length == 0)
		return; // not index

	var titlePrefix = document.title.split("-")[0]+"- ";
	var titleEnd = document.title.split("-")[1].slice(1);

	var opsubject = $(".post.op .subject").text().trim();
	var optext = $(".post.op .body").text().trim();

	if(opsubject) {
		titleEnd = opsubject;
	} else if(optext) {
		if(optext.length > 20)
			titleEnd = optext.slice(0,20)+"...";
		else
			titleEnd = optext;
	}
	var mainTitle = titlePrefix+titleEnd;

	var $unseenPosts = $(".post.reply");

	var oldCount = -1;
	var scrollHandler = null;
	$(window).scroll(function(event) {
		if(scrollHandler)
			return;
		scrollHandler = setTimeout(function() {
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
			if($unseenPosts.length != oldCount)
				document.title = "("+$unseenPosts.length+") "+mainTitle;
			oldCount = $unseenPosts.length;
			scrollHandler = null;
		}, 100);
	}).scroll();

	$(document).bind('new_post', function(e, post) {
		$unseenPosts = $unseenPosts.add(post);
		document.title = "("+$unseenPosts.length+") "+mainTitle;
		oldCount = $unseenPosts.length;
	});
});
