/*
 * post-hover.js
 * https://github.com/savetheinternet/Tinyboard/blob/master/js/post-hover.js
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/post-hover.js';
 *
 */

$(document).ready(function(){
	settings.newProp("preview_hover", "bool", true, "Preview post on link hover");
	settings.newProp("preview_inline", "bool", true, "Preview post inline on link click");

	var preview_hover = settings.getProp("preview_hover");
	var preview_inline = settings.getProp("preview_inline");
	$(document).on("setting_change", function(e, setting) {
		if (setting == "preview_hover")
			preview_hover = settings.getProp("preview_hover");
		else if (setting == "preview_inline")
			preview_inline = settings.getProp("preview_inline");
	});

	var page_url_data = {};
	var page_url_callbacks = {};

	var fix_image_src = function($tag) {
		$tag.find('img').each(function() {
			var realsrc = $(this).attr('data-src');
			if (realsrc) {
				$(this).attr('src', realsrc);
			}
		});
	};

	var load_post_from_data = function(id, $data) {
		if($('#replyC_' + id).length > 0) {
			return;
		}
		
		var $newpostC = $data.find('#replyC_'+id).first().clone();
		if ($newpostC.length) {
			$newpostC.addClass('preview-hidden').appendTo(document.body);
			fix_image_src($newpostC);
		}
	};

	var load_post = function(id, url, callback) {
		url = url.replace(/#.*$/, '');
		
		if (!page_url_data[url]) {
			page_url_data[url] = true;
			page_url_callbacks[url] = [];
			page_url_callbacks[url].push([id, callback]);
			$.ajax({
				url: url,
				success: function(data) {
					// Don't load all images
					data = data.replace( /(<img\b[^>]+)\b(src\s*=\s*('[^']*'|"[^"]*"))/g, '$1data-$2');
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
	};
	
	init_hover = function() {
		var $link = $(this);
		
		var id;
		
		if(id = $link.text().match(/^>>(\d+)$/)) {
			id = id[1];
		} else {
			return;
		}

		if ($('#' + id).not('.preview-hidden').length) {
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
			
			var start_hover = function() {
				$post = $('div.post#reply_' + id).first();

				if ($post.length == 0)
					return false;

				if (hovering) {
					$('#post-hover-' + id).remove();
					var $newPost = $post.clone();
					$newPost.find('span.mentioned').off('mouseenter').off('mouseleave').off('mousemove');
					$newPost.find('[id]').attr('id', '');
					$newPost.find('.post-inline-container').remove();
					$newPost.find('.inlined').removeClass('inlined');
					$newPost.find('a').filter(function() {
						return $(this).text() === '>>' + parent_id;
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
			};
			
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

			var place_inline = function() {
				if ($link.parent().hasClass('mentioned'))
					$inlined_postC.insertAfter($link.parents('.intro').first());
				else
					$inlined_postC.insertAfter($link);
			};

			var start_inline = function() {
				$postC = $('#replyC_' + id).first();

				if ($postC.length == 0)
					return false;

				if ($link.hasClass('inlined')) {
					if ($inlined_postC)
						$inlined_postC.remove();
					$inlined_postC = $postC.clone();
					$inlined_postC.find('[id]').attr('id', '');
					$inlined_postC.find('.post-inline-container').remove();
					$inlined_postC.find('.inlined').removeClass('inlined');
					$inlined_postC.find('a').filter(function() {
						return $(this).text() === '>>' + parent_id;
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
			};

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
	};
	
	$('.body a:not([rel="nofollow"])').each(init_hover);
	
	// allow to work with auto-reload.js, etc.
	$(document).bind('new_post', function(e, post) {
		$(post).find('.body a:not([rel="nofollow"])').each(init_hover);
	});
});
