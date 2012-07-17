/*
 * qr.js
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

		if(!event.ctrlKey)
			return true;

		var tag;
		switch(event.which) {
		case 66: tag = 'b'; break;
		case 72: tag = 'h'; break;
		case 73: tag = 'i'; break;
		case 83: tag = 'spoiler'; break;
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
		return false;
	});
});
