/*
 * default.js
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org>
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import _ from 'lodash';
import {log_error} from '../logger';
import myPosts from '../my-posts';

function get_cookie(cookie_name) {
	var results = document.cookie.match ( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)');
	if (results)
		return (unescape(results[2]));
	else
		return null;
}

window.highlightReply = function highlightReply(id) {
	if (typeof event != "undefined" && event && typeof event.which != "undefined" && event.which == 2) {
		// don't highlight on middle click
		return true;
	}

	$('.highlighted').removeClass('highlighted');
	if (id)
		$('#reply_'+id).addClass('highlighted');
};

window.confirmDelete = function confirmDelete() {
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
};

function generatePassword() {
	var pass = '';
	var chars = SITE_DATA.genpassword_chars;
	for (var i = 0; i < 8; i++) {
		var rnd = Math.floor(Math.random() * chars.length);
		pass += chars.substring(rnd, rnd + 1);
	}
	return pass;
}

window.dopost = function dopost(form) {
	if (window.localStorage) {
		if (form.elements.name) {
			localStorage.setItem('name', form.elements.name.value.replace(/( |^)## .+$/, ''));
		}
		if (form.elements.email && form.elements.email.value != 'sage') {
			localStorage.setItem('email', form.elements.email.value);
		}

		var saved;
		if (sessionStorage.body)
			saved = JSON.parse(sessionStorage.body);
		else
			saved = {};

		saved[board_id+":"+thread_id] = form.elements.body.value;
		sessionStorage.body = JSON.stringify(saved);
	}

	return form.elements.body.value != "" || form.elements.file.value != "";
};

window.citeReply = function citeReply(id) {
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
};

function rememberStuff() {
	if (document.forms.post) {
		if (document.forms.post.password) {
			var password = window.localStorage && localStorage.getItem('password');
			if (!password)
				password = generatePassword();
			document.forms.post.password.value = password;
			if (window.localStorage) {
				try {
					localStorage.setItem('password', password);
				} catch(e) {}
			}
		}

		if (window.localStorage) {
			if (localStorage.getItem('name') && document.forms.post.elements.name)
				document.forms.post.elements.name.value = localStorage.getItem('name');
			if (localStorage.getItem('email') && document.forms.post.elements.email)
				document.forms.post.elements.email.value = localStorage.getItem('email');
		}

		if (/^#q\d+$/.exec(window.location.hash))
			citeReply(window.location.hash.substring(2));

		if (window.sessionStorage && sessionStorage.body) {
			var saved = JSON.parse(sessionStorage.body);
			if (get_cookie(SITE_DATA.cookiename)) {
				// Remove successful posts
				var successful;
				try {
					successful = JSON.parse(get_cookie(SITE_DATA.cookiename));
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
							if (!myPosts.contains(board+":"+postid)) {
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

		if (get_cookie(SITE_DATA.cookiename)) {
			document.cookie = SITE_DATA.cookiename+'={};expires=0;path='+SITE_DATA.cookiepath+';';
		}
	}
}

$(document).ready(function() {
	rememberStuff();

	if (window.localStorage && localStorage.getItem('password') && document.forms.postcontrols) {
		document.forms.postcontrols.password.value = localStorage.getItem('password');
	}

	if (/^#\d+$/.exec(window.location.hash))
		highlightReply(window.location.hash.substring(1));
});

window.board_id = null;
window.thread_id = null;
(function() {
	var path_board_regex = new RegExp("^"+SITE_DATA.siteroot+"(?:mod\\.php\\?/)?([^/]+)/(?:res/([0-9]+))?");
	var reg_result = path_board_regex.exec(document.location.pathname+document.location.search);
	if (reg_result) {
		board_id = reg_result[1];
		if (reg_result[2] === undefined)
			thread_id = 0;
		else
			thread_id = parseInt(reg_result[2]);
	}
})();

window.make_thread_url = function make_thread_url(board, postnum) {
	if (document.location.pathname == SITE_DATA.siteroot+'mod.php')
		return '?/'+board+'/res/'+postnum+'.html';
	else
		return SITE_DATA.siteroot+board+'/res/'+postnum+'.html';
};

window.make_thread50_url = function make_thread50_url(board, postnum) {
	if (document.location.pathname == SITE_DATA.siteroot+'mod.php')
		return '?/'+board+'/res/'+postnum+'+50.html';
	else
		return SITE_DATA.siteroot+board+'/res/'+postnum+'+50.html';
};

window.get_url_params = function get_url_params(url, includeHash) {
	function decode (s) {
		return decodeURIComponent(s.replace(/\+/g, ' '));
	}

	if (!includeHash)
		url = url.replace(/#.*/, '');
	var params = {};
	var match_params = /[?#](.*)$/.exec(url);
	if (match_params) {
		var params_part = match_params[1];
		var search = /([^&#=]+)=?([^&#]*)/g;
		var match;
		while ((match = search.exec(params_part))) {
			params[decode(match[1])] = decode(match[2]);
		}
	}
	return params;
};

window.pageHasFocus = function() {
	if (document.hasFocus)
		return document.hasFocus();
	if (document.visibilityState)
		return document.visibilityState == 'visible';
	return true;
};

// Disables all img, audio, video, and script tags in some html
window.mogrifyHTML = function mogrifyHTML(html) {
	function mogrifier(text) {
		return '<span class="mogrifier" data-data="' + _.escape(text) + '"></span>';
	}

	html = html.replace(/<img\b[^>]*>/g, mogrifier);
	html = html.replace(/<audio\b[^>]*>.*?<\/audio>/g, mogrifier);
	html = html.replace(/<video\b[^>]*>.*?<\/video>/g, mogrifier);
	html = html.replace(/<script\b[^>]*>.*?<\/script>/g, mogrifier);

	return html;
};

// Re-enables mogrified tags in an element
window.demogrifyEl = function demogrifyEl($el) {
	$el.find('.mogrifier').each(function() {
		var $mog = $(this);
		var html = $mog.attr('data-data');
		$mog.html(html);
		$mog.children().unwrap();
	});
};

$(document).on('new_post', function(e, post) {
	demogrifyEl($(post));
});

window.RecaptchaOptions = {
	theme : 'clean'
};
