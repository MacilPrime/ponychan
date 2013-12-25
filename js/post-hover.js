/*
 * post-hover.js
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org>
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

settings.newSetting("preview_inline", "bool", true, "Preview post inline on link click", 'links', {orderhint:1});
settings.newSetting("preview_hover", "bool", true, "Preview post on link hover", 'links', {orderhint:2});

$(document).ready(function(){
	var preview_hover = settings.getSetting("preview_hover");
	var preview_inline = settings.getSetting("preview_inline");
	$(document).on("setting_change", function(e, setting) {
		if (setting == "preview_hover")
			preview_hover = settings.getSetting("preview_hover");
		else if (setting == "preview_inline")
			preview_inline = settings.getSetting("preview_inline");
	});
	
	var page_url_data = {};
	var page_url_callbacks = {};
	
	function make_mature_warning_postC(id) {
		var $newpostC = $("<div/>")
			.addClass('preview-hidden')
			.addClass('preview-no-mature')
			.addClass('postContainer')
			.addClass('replyContainer');
		var $newpost = $("<div/>")
			.addClass('post')
			.addClass('reply')
			.text('Linked post is in a mature content thread, and viewing mature content threads is currently disabled.')
			.appendTo($newpostC);
		if (id) {
			$newpostC.attr("id", "replyC_"+id);
			$newpost.attr("id", "reply_"+id);
		}
		return $newpostC;
	}
	
	function load_post_from_data(id, $data) {
		if($('#replyC_' + id).length > 0) {
			return;
		}
		
		var $postC = $data.find('#replyC_'+id);
		if (!$postC.length)
			return;

		var $newpostC;
		if (!settings.getSetting("show_mature") && $postC.parents(".thread").first().hasClass("mature_thread"))
			$newpostC = make_mature_warning_postC(id);
		else
			var $newpostC = $postC.clone();
		
		$newpostC.addClass('preview-hidden').appendTo(document.body);
	}
	
	function load_post(id, url, callback) {
		url = url.replace(/#.*$/, '');
		
		if (!page_url_data[url]) {
			page_url_data[url] = true;
			page_url_callbacks[url] = [];
			page_url_callbacks[url].push([id, callback]);
			$.ajax({
				url: url,
				success: function(data) {
					data = mogrifyHTML(data);
					var $data = $(data);
					page_url_data[url] = $data;
					
					for (var i=0; i < page_url_callbacks[url].length; i++) {
						load_post_from_data(page_url_callbacks[url][i][0], $data);
						page_url_callbacks[url][i][1]();
					}
					delete page_url_callbacks[url];
				}
			});
		} else {
			var $data = page_url_data[url];
			if ($data !== true) {
				load_post_from_data(id, $data);
				callback();
			} else {
				// There already is an AJAX call in progress to load this post
				page_url_callbacks[url].push([id, callback]);
			}
		}
	}
	
	function init_postlink_hover() {
		var $link = $(this);
		
		var id;
		
		if(id = $link.text().match(/^>>(\d+)/)) {
			id = parseInt(id[1]);
		} else {
			return;
		}

		if ($('#replyC_' + id).not('.preview-hidden').length) {
			$link.attr('href', '#'+id);
		}

		var $parent_post = $link.parents('.post').first();
		var parent_id = $parent_post.find('.intro').first().find('.post_no:eq(1)').first().text();
		
		var $post = false;
		var hovering = false;
		var hovered_at;

		var $inlined_postC = null;
		$link.hover(function(e) {
			if (!preview_hover)
				return;
			if ($link.hasClass('inlined'))
				return;

			hovering = true;
			hovered_at = {'x': e.pageX, 'y': e.pageY};
			
			function start_hover() {
				$post = $('#reply_' + id).first();

				if ($post.length == 0)
					return false;

				if (!settings.getSetting("show_mature") && $post.parents(".thread").first().hasClass("mature_thread"))
					$post = make_mature_warning_postC().find(".post");

				if (hovering) {
					$('#post-hover-' + id).remove();
					var $newPost = $post.clone();
					$newPost.find('span.mentioned').off('mouseenter').off('mouseleave').off('mousemove');
					$newPost.find('[id]').attr('id', '');
					$newPost.find('.post-inline-container').remove();
					$newPost.find('.inlined').removeClass('inlined');
					$newPost.find('a').filter(function() {
						return $(this).text().match('^>>'+parent_id+'\\b');
					}).addClass('parent-link');
					$newPost
						.attr('id', 'post-hover-' + id)
						.addClass('post-hover')
						.addClass('reply')
						.addClass('post_' + id)
						.removeClass('preview-hidden')
						.removeClass('highlighted')
						.appendTo(document.body);
					$(document).trigger('new_post', $newPost[0]);
					$link.trigger('mousemove');
				}
				return true;
			}
			
			if(!start_hover()) {
				$("<div/>")
					.attr('id','post-hover-'+id)
					.addClass('post-hover')
					.addClass('post')
					.addClass('reply')
					.text('Loading...')
					.appendTo(document.body);
				$link.trigger('mousemove');
				load_post(id, $link.attr('href'), start_hover);
			}
		}, function() {
			hovering = false;
			if(!$post)
				return;
			
			$('#post-hover-' + id).remove();
		}).mousemove(function(e) {
			if(!$post)
				return;
			
			var $hover = $('#post-hover-' + id);
			if($hover.length == 0)
				return;
			
			var top = (e.pageY ? e.pageY : hovered_at['y']) - 10;
			
			if(e.pageY < $(window).scrollTop() + 15) {
				top = $(window).scrollTop();
			} else if(e.pageY > $(window).scrollTop() + $(window).height() - $hover.height() - 15) {
				top = $(window).scrollTop() + $(window).height() - $hover.height() - 15;
			}
			
			
			$hover.css('left', (e.pageX ? e.pageX : hovered_at['x'])).css('top', top);
		}).click(function(e) {
			if (!preview_inline)
				return;
			$link.trigger('mouseleave');
			e.preventDefault();

			function place_inline() {
				if ($link.parent().hasClass('mentioned'))
					$inlined_postC.insertAfter($link.parents('.intro').first());
				else
					$inlined_postC.insertAfter($link);
			}

			function start_inline() {
				$postC = $('#replyC_' + id).first();

				if ($postC.length == 0)
					return false;

				if (!settings.getSetting("show_mature") && $postC.parents(".thread").first().hasClass("mature_thread"))
					$postC = make_mature_warning_postC();

				if ($link.hasClass('inlined')) {
					if ($inlined_postC)
						$inlined_postC.remove();
					$inlined_postC = $postC.clone();
					$inlined_postC.find('[id]').attr('id', '');
					$inlined_postC.find('.post-inline-container, .postSide, .postStub').remove();
					$inlined_postC.find('.inlined').removeClass('inlined');
					$inlined_postC.find('a').filter(function() {
						return $(this).text().match('^>>'+parent_id+'\\b');
					}).addClass('parent-link');
					$inlined_postC
						.attr('id', '')
						.addClass('post-inline-container')
						.addClass('replyContainer')
						.addClass('postC_' + id)
						.removeClass('preview-hidden');

					place_inline();

					$inlined_postC.find('.post').each(function() {
						var $inlined_post = $(this);
						$inlined_post
							.removeClass('highlighted')
							.addClass('reply')
							.addClass('post_' + id)
							.addClass('post-inline');
						$(document).trigger('new_post', this);
					});
				}
				return true;
			}
			
			if (!$link.hasClass('inlined')) {
				// Don't allow opening a post preview of a parent post.
				// (Artificial limit, it would work fine. Just enforcing
				// some sanity.)
				if ($link.parents('.post_'+id).length)
					return;
				$link.addClass('inlined');
				if(!start_inline()) {
					$inlined_postC = $("<div/>")
						.addClass('postContainer')
						.addClass('replyContainer')
						.addClass('post-inline-container');
					$('<div/>')
						.addClass('post')
						.addClass('reply')
						.addClass('post-inline')
						.text("Loading...")
						.appendTo($inlined_postC);
					place_inline();
					load_post(id, $link.attr('href'), start_inline);
				}
			} else {
				$link.removeClass('inlined');
				if ($inlined_postC) {
					$inlined_postC.remove();
					$inlined_postC = null;
				}
			}
		});
	}
	window.init_postlink_hover = init_postlink_hover;
	
	$('a.postlink').each(init_postlink_hover);
	
	$(document).on('new_post', function(e, post) {
		$(post).find('a.postlink').each(init_postlink_hover);
	});
});
