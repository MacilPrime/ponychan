/*
 * image-hover.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/image-hover.js';
 *
 */

$(document).ready(function(){
	settings.newProp("image_hover_enabled", "bool", true, "Expand image on hover");

	var image_hover_enabled = settings.getProp("image_hover_enabled", "bool");
	$(document).on("setting_change", function(e, setting) {
		if (setting == "image_hover_enabled")
			image_hover_enabled = settings.getProp("image_hover_enabled", "bool");
	});

	init_image_hover = function() {
		var $image = $(this);
		var imageurl = $image.parent().attr("href");
		var hovered_at;
		$image.hover(function(e) {
			if(!image_hover_enabled)
				return;
			if($image.parent()[0].tag)
				return;

			hovered_at = {'x': e.pageX, 'y': e.pageY};
			
			var $newImage = $("<img/>");
			$newImage
				.addClass('image-hover')
				.attr('src', imageurl)
				.css('position', 'absolute')
				.css('margin', '0')
				.css('padding', '0')
				.css('maxWidth', '75%')
				.css('maxHeight', '95%')
				.insertAfter($image.parent())
				.load(function() {
					$(this).trigger('mousemove');
				});
			$image.trigger('mousemove');
		}, function() {
			$('.image-hover').remove();
		}).mousemove(function(e) {
			var $hover = $('.image-hover');
			if($hover.length == 0)
				return;
			
			var top = (e.pageY ? e.pageY : hovered_at['y']) - 10;
			
			if(e.pageY < $(window).scrollTop() + 15) {
				top = $(window).scrollTop();
			} else if(e.pageY > $(window).scrollTop() + $(window).height() - $hover.height() - 30) {
				top = $(window).scrollTop() + $(window).height() - $hover.height() - 30;
			}
			
			$hover.css('left', (e.pageX ? e.pageX : hovered_at['x']) + 20).css('top', top);
		}).click(function() {
			$image.trigger('mouseleave');
		});
	};
	
	$('form[name="postcontrols"]>div>a:not([class="file"])>img').each(init_image_hover);
	$('div.post>a:not([class="file"])>img').each(init_image_hover);
	$(document).bind('new_post', function(e, post) {
		$(post).find('>a:not([class="file"])>img').each(init_image_hover);
	});
});
