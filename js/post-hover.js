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
	var page_url_data = {};

	var fix_image_src = function($tag) {
		$tag.find('img').each(function() {
			var realsrc = $(this).attr('data-src');
			if (realsrc) {
				$(this).attr('src', realsrc);
			}
		});
	};

	init_hover = function() {
		var $link = $(this);
		
		var id;
		
		if(id = $link.text().match(/^>>(\d+)$/)) {
			id = id[1];
		} else {
			return;
		}
		
		var $post = false;
		var hovering = false;
		var hovered_at;
		$link.hover(function(e) {
			hovering = true;
			hovered_at = {'x': e.pageX, 'y': e.pageY};
			
			var start_hover = function($link) {
				$post = $('div.post#reply_' + id).first();

				if ($post.length == 0)
					return false;

				if (hovering) {
					var $newPost = $post.clone();
					$newPost.find('span.mentioned').off('mouseenter').off('mouseleave').off('mousemove');
					$newPost
						.attr('id', 'post-hover-' + id)
						.addClass('post-hover')
						.addClass('reply')
						.css('position', 'absolute')
						.css('border-style', 'solid')
						.css('box-shadow', '1px 1px 1px #999')
						.css('margin-left', '16px')
						.css('display', 'block')
						.prependTo(document.body);
					$link.trigger('mousemove');
				}
				return true;
			};

			var load_post_from_data = function(id, $data) {
				if($('#' + $(this).attr('id')).length > 0) {
					console.error("load_post_from_data("+id+", $data) called redundantly");
					return;
				}

				$data.find('#reply_'+id).each(function() {
					var $newpost = $(this).css('display', 'none').addClass('hidden').prependTo($('div.post:first'));
					fix_image_src($newpost);
					$(document).trigger('new_post', $newpost[0]);
					return;
				});
			};
			
			if(!start_hover($(this))) {
				var url = $link.attr('href').replace(/#.*$/, '');
				
				if (!page_url_data[url]) {
					page_url_data[url] = true;
					$.ajax({
						url: url,
						context: document.body,
						success: function(data) {
							// Don't load all images
							data = data.replace( /(<img\b[^>]+)\b(src\s*=\s*('[^']*'|"[^"]*"))/g, '$1data-$2');
							var $data = $(data);
							page_url_data[url] = $data;
							
							load_post_from_data(id, $data);
							start_hover($(this));
						}
					});
				} else {
					var $data = page_url_data[url];
					if ($data !== true) {
						load_post_from_data(id, $data);
						start_hover($(this));
					}
				}
			}
		}, function() {
			hovering = false;
			if(!$post)
				return;
			
			$post.attr('style', '');
			if($post.hasClass('hidden'))
				$post.css('display', 'none');
			$('.post-hover').remove();
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
		});
	};
	
	$('.body a:not([rel="nofollow"])').each(init_hover);
	
	// allow to work with auto-reload.js, etc.
	$(document).bind('new_post', function(e, post) {
		$(post).find('.body a:not([rel="nofollow"])').each(init_hover);
	});
});
