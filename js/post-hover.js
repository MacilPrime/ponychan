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
	// settings.newProp("preview_inline", "bool", true, "Preview post inline on link click");

	var preview_hover = settings.getProp("preview_hover");
	// var preview_inline = settings.getProp("preview_inline");
	$(document).on("setting_change", function(e, setting) {
		if (setting == "preview_hover")
			preview_hover = settings.getProp("preview_hover");
		// else if (setting == "preview_inline")
		// 	preview_inline = settings.getProp("preview_inline");
	});

	var page_url_data = {};

	var fix_image_src = function($tag) {
		$tag.find('img').each(function() {
			var realsrc = $(this).attr('data-src');
			if (realsrc) {
				$(this).attr('src', realsrc);
			}
		});
	};

	var load_post_from_data = function(id, $data) {
		if($('#reply_' + id).length > 0) {
			console.error("load_post_from_data("+id+", $data) called redundantly");
			return;
		}
		
		var $newpost = $data.find('#reply_'+id).first().clone();
		if ($newpost.length) {
			$newpost.addClass('preview-hidden').appendTo(document.body);
			fix_image_src($newpost);
			$(document).trigger('new_post', $newpost[0]);
		}
	};

	var load_post = function(id, url, callback) {
		url = url.replace(/#.*$/, '');
		
		if (!page_url_data[url]) {
			page_url_data[url] = true;
			$.ajax({
				url: url,
				success: function(data) {
					// Don't load all images
					data = data.replace( /(<img\b[^>]+)\b(src\s*=\s*('[^']*'|"[^"]*"))/g, '$1data-$2');
					var $data = $(data);
					page_url_data[url] = $data;
					
					load_post_from_data(id, $data);
					callback();
				}
			});
		} else {
			var $data = page_url_data[url];
			if ($data !== true) {
				load_post_from_data(id, $data);
				callback();
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
			var href = $link.attr('href').replace(/^[^#]*/, '');
			$link.attr('href', href);
		}
		
		var $post = false;
		var hovering = false;
		var hovered_at;

		var $inlined_post = null;
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
					$newPost.find('#' + id).attr('id', '');
					$newPost
						.attr('id', 'post-hover-' + id)
						.addClass('post-hover')
						.addClass('reply')
						.addClass('post_' + id)
						.removeClass('preview-hidden')
						.appendTo(document.body);
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
			
			//console.log("mousemove for "+id);
			var top = (e.pageY ? e.pageY : hovered_at['y']) - 10;
			
			if(e.pageY < $(window).scrollTop() + 15) {
				top = $(window).scrollTop();
			} else if(e.pageY > $(window).scrollTop() + $(window).height() - $hover.height() - 15) {
				top = $(window).scrollTop() + $(window).height() - $hover.height() - 15;
			}
			
			
			$hover.css('left', (e.pageX ? e.pageX : hovered_at['x'])).css('top', top);
		}).click(function() {
			// $link.trigger('mouseleave');
			// if (!$link.hasClass('inlined')) {
			// 	$link.addClass('inlined');
			// 	$inlined_post = $post.clone();
			// } else {
			// 	$link.removeClass('inlined');
			// 	if ($inlined_post)
			// 		$inlined_post.remove();
			// }
		});
	};
	
	$('.body a:not([rel="nofollow"])').each(init_hover);
	
	// allow to work with auto-reload.js, etc.
	$(document).bind('new_post', function(e, post) {
		$(post).find('.body a:not([rel="nofollow"])').each(init_hover);
	});
});
