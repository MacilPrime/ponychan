/*
 * tags.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 * Puts bbcode at the cursor position on specific key combos.
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/tags.js';
 *
 */

$(document).ready(function(){
	$(document).keydown(function(event) {
		if(!/TEXTAREA/.test(event.target.nodeName))
			return true;

		if(!event.ctrlKey || event.shiftKey)
			return true;

		var tag;
		switch(event.which) {
		case 66: tag = 'b'; break;
		case 72: tag = 'h'; break;
		case 73: tag = 'i'; break;
		case 82: tag = 's'; break;
		case 83: tag = '?'; break;
		case 85: tag = 'u'; break;
		default:
			return true;
		}

		if(typeof event.target.selectionStart == "undefined" || event.target.selectionStart == null)
			return true;

		var text = $(event.target).val();
		var start = event.target.selectionStart;
		var end = event.target.selectionEnd;
		text = text.slice(0,start) + '['+tag+']' + text.slice(start,end) + '[/'+tag+']' + text.slice(end);
		$(event.target).val(text);
		var afterInsert = end + ('['+tag+']').length;
		event.target.setSelectionRange(afterInsert, afterInsert);
		return false;
	});
});
