/*
 * default.js
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org>
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/default.js';
 *
 */

function get_cookie(cookie_name) {
	var results = document.cookie.match ( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)');
	if (results)
		return (unescape(results[2]));
	else
		return null;
}

function highlightReply(id) {
	if (typeof event != "undefined" && event && typeof event.which != "undefined" && event.which == 2) {
		// don't highlight on middle click
		return true;
	}
	
	$('.highlighted').removeClass('highlighted');
	if (id)
		$('#reply_'+id).addClass('highlighted');
}

function confirmDelete() {
	var count = $('form[name="postcontrols"] input.delete:checked').length;
	if (count == 0) {
		alert('No posts selected');
		return false;
	} else {
		var message;
		if (count == 1)
			message = 'Are you sure you want to delete the selected post?';
		else
			message = 'Are you sure you want to delete the '+count+' selected posts?';
		
		return confirm(message);
	}
}

function generatePassword() {
	var pass = '';
	var chars = genpassword_chars;
	for (var i = 0; i < 8; i++) {
		var rnd = Math.floor(Math.random() * chars.length);
		pass += chars.substring(rnd, rnd + 1);
	}
	return pass;
}

function dopost(form) {
	if (window.localStorage) {
		if (form.elements['name']) {
			localStorage.name = form.elements['name'].value.replace(/( |^)## .+$/, '');
		}
		if (form.elements['email'] && form.elements['email'].value != 'sage') {
			localStorage.email = form.elements['email'].value;
		}
		
		var saved;
		if (sessionStorage.body)
			saved = JSON.parse(sessionStorage.body);
		else
			saved = {};
		
		saved[board_id+":"+thread_id] = form.elements['body'].value;
		sessionStorage.body = JSON.stringify(saved);
	}
	
	return form.elements['body'].value != "" || form.elements['file'].value != "";
}

function citeReply(id) {
	var body = document.getElementById('body');
	
	if (document.selection) {
		// IE
		body.focus();
		var sel = document.selection.createRange();
		sel.text = '>>' + id + '\n';
	} else if (body.selectionStart || body.selectionStart == '0') {
		// Mozilla
		var start = body.selectionStart;
		var end = body.selectionEnd;
		body.value = body.value.substring(0, start) + '>>' + id + '\n' + body.value.substring(end, body.value.length);
	} else {
		// ???
		body.value += '>>' + id + '\n';
	}
}

function rememberStuff() {
	if (document.forms.post) {
		if (document.forms.post.password) {
			var password = window.localStorage && localStorage.password;
			if (!password)
				password = generatePassword();
			document.forms.post.password.value = password;
			if (window.localStorage) {
				try {
					localStorage.password = password;
				} catch(e) {}
			}
		}
		
		if (window.localStorage) {
			if (localStorage.name && document.forms.post.elements['name'])
				document.forms.post.elements['name'].value = localStorage.name;
			if (localStorage.email && document.forms.post.elements['email'])
				document.forms.post.elements['email'].value = localStorage.email;
		}
		
		if (window.location.hash.indexOf('q') == 1)
			citeReply(window.location.hash.substring(2));
		
		if (window.sessionStorage && sessionStorage.body) {
			var saved = JSON.parse(sessionStorage.body);
			if (get_cookie(cookiename)) {
				// Remove successful posts
				try {
					var successful = JSON.parse(get_cookie(cookiename));
				} catch(e) {
					log_error(e);
				}
				if (successful) {
					for (var id in successful) {
						delete saved[id];
						if (successful[id] !== true) {
							var split = id.split(":");
							var postid = successful[id];
							var threadid = (split[1] == 0) ? null : parseInt(split[1]);
							var board = split[0];
							if (postlinkinfo.myposts.indexOf(board+":"+postid) == -1) {
								var url = make_thread_url(board, (threadid == null) ? postid : threadid);
								$(document).trigger('post_submitted', {
									postid: postid,
									threadid: threadid,
									board: board,
									url: url
								});
							}
						}
					}
					sessionStorage.body = JSON.stringify(saved);
				}
			}
			var thisBody = saved[board_id+":"+thread_id];
			if (thisBody) {
				document.forms.post.body.value = thisBody;
			}
		}
		
		if (get_cookie(cookiename)) {
			document.cookie = cookiename+'={};expires=0;path='+cookiepath+';';
		}
	}
}

$(document).ready(function init() {
	if (window.localStorage && localStorage.password && document.forms.postcontrols) {
		document.forms.postcontrols.password.value = localStorage.password;
	}
	
	if (window.location.hash.indexOf('q') != 1 && window.location.hash.substring(1))
		highlightReply(window.location.hash.substring(1));
});

var board_id = null;
var thread_id = null;
(function() {
	var path_board_regex = new RegExp("^"+siteroot+"(?:mod\\.php\\?/)?([^/]+)/(?:res/([0-9]+))?");
	var reg_result = path_board_regex.exec(document.location.pathname+document.location.search);
	if (reg_result) {
		board_id = reg_result[1];
		if (reg_result[2] === undefined)
			thread_id = 0;
		else
			thread_id = parseInt(reg_result[2]);
	}
})();

function make_thread_url(board, postnum) {
	if (document.location.pathname == siteroot+'mod.php')
		return '?/'+board+'/res/'+postnum+'.html';
	else
		return siteroot+board+'/res/'+postnum+'.html';
}
	
function make_thread50_url(board, postnum) {
	if (document.location.pathname == siteroot+'mod.php')
		return '?/'+board+'/res/'+postnum+'+50.html';
	else
		return siteroot+board+'/res/'+postnum+'+50.html';
}
	
function get_post_board($post) {
	return /\bpost_(\w+)-\d+\b/.exec($post.attr("class"))[1];
}

function get_post_num($post) {
	return parseInt(/\bpost_(\d+)\b/.exec($post.attr("class"))[1]);
}

function get_post_id($post) {
	var match = /\bpost_(\w+)-(\d+)\b/.exec($post.attr("class"));
	return match[1]+':'+match[2];
}

function get_post_class(postid) {
	var match = /^(\w+):(\d+)$/.exec(postid);
	return 'post_'+match[1]+'-'+match[2];
}

function get_url_params(url) {
	url = url.replace(/#.*/, '');
	var params = {};
	var match_params = /\?(.*)$/.exec(url);
	if (match_params) {
		var params_part = match_params[1];
		function decode (s) {
			return decodeURIComponent(s.replace(/\+/g, ' '));
		}
		var search = /([^&=]+)=?([^&]*)/g;
		var match;
		while (match = search.exec(params_part))
			params[decode(match[1])] = decode(match[2]);
	}
	return params;
}

function isArray(o) {
	return Object.prototype.toString.call(o) === '[object Array]';
}

function setCss(key, css) {
	var $style = $("style.setcss#setcss_"+key);
	if (!$style.length) {
		$style = $("<style/>")
			.addClass("setcss")
			.attr("id", "setcss_"+key)
			.attr("type", "text/css")
			.appendTo(document.head);
	}
	$style.text(css);
}

function htmlEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Disables all img, audio, video, and script tags in some html
function mogrifyHTML(html) {
	function mogrifier(text) {
		return '<span class="mogrifier" data-data="' + htmlEntities(text) + '"></span>';
	}
	
	html = html.replace(/<img\b[^>]*>/g, mogrifier);
	html = html.replace(/<audio\b[^>]*>.*?<\/audio>/g, mogrifier);
	html = html.replace(/<video\b[^>]*>.*?<\/video>/g, mogrifier);
	html = html.replace(/<script\b[^>]*>.*?<\/script>/g, mogrifier);
	
	return html;
}

// Re-enables mogrified tags in an element
function demogrifyEl($el) {
	$el.find('.mogrifier').each(function() {
		var $mog = $(this);
		var html = $mog.attr('data-data');
		$mog.html(html);
		$mog.children().unwrap();
	});
}

$(document).on('new_post', function(e, post) {
	demogrifyEl($(post));
});

var RecaptchaOptions = {
	theme : 'clean'
};
