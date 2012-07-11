/*
 * inline-expanding.js
 * https://github.com/savetheinternet/Tinyboard/blob/master/js/inline-expanding.js
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org> &
 * Alyssa Rowan <alyssa.rowan@gmail.com>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/inline-expanding.js';
 *
 */
$(document).ready(function(){
	var init_expand_image = function() {
		$(this).parent().click(function(e) {
			if(e.which == 2) {
				return true;
			}
			if(!this.tag) {
				this.tag = this.childNodes[0].src;
				this.childNodes[0].src = this.href;
				this.childNodes[0].style.width = 'auto';
				this.childNodes[0].style.maxWidth = '100%';
				this.childNodes[0].style.height = 'auto';
				this.childNodes[0].style.opacity = '0.4';
				this.childNodes[0].style.filter = 'alpha(opacity=40)';
				this.childNodes[0].onload = function() {
					this.style.opacity = '1';
					this.style.filter = '';
				}
			} else {
				this.childNodes[0].src = this.tag;
				this.childNodes[0].style.width = 'auto';
				this.childNodes[0].style.height = 'auto';
				this.tag = '';
			}
			return false;
		});
	};
	$('div.threadblock>a:not([class="file"])>img').each(init_expand_image);
	$('div.post>a:not([class="file"])>img').each(init_expand_image);
	$(document).bind('new_post', function(e, post) {
		$(post).find('>a:not([class="file"])>img').each(init_expand_image);
	});
});
