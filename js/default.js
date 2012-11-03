/*
 * default.js
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
	
	var divs = document.getElementsByTagName('div');
	for (var i = 0; i < divs.length; i++)
	{
		if (divs[i].className.indexOf('post') != -1)
			divs[i].className = divs[i].className.replace(/highlighted/, '');
	}
	if (id) {
		var post = document.getElementById('reply_'+id);
		if (post)
			post.className += ' highlighted';
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

var saved = {};

function dopost(form) {
	if (form.elements['name']) {
		localStorage.name = form.elements['name'].value.replace(/ ##.+$/, '');
	}
	if (form.elements['email'] && form.elements['email'].value != 'sage') {
		localStorage.email = form.elements['email'].value;
	}
	
	saved[document.location] = form.elements['body'].value;
	sessionStorage.body = JSON.stringify(saved);
	
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
			if (!localStorage.password)
				localStorage.password = generatePassword();
			document.forms.post.password.value = localStorage.password;
		}
		
		if (localStorage.name && document.forms.post.elements['name'])
			document.forms.post.elements['name'].value = localStorage.name;
		if (localStorage.email && document.forms.post.elements['email'])
			document.forms.post.elements['email'].value = localStorage.email;
		
		if (window.location.hash.indexOf('q') == 1)
			citeReply(window.location.hash.substring(2));
		
		if (sessionStorage.body) {
			var saved = JSON.parse(sessionStorage.body);
			if (get_cookie(cookiename)) {
				// Remove successful posts
				var successful = JSON.parse(get_cookie(cookiename));
				for (var url in successful) {
					saved[url] = null;
				}
				sessionStorage.body = JSON.stringify(saved);
				
				document.cookie = cookiename+'={};expires=0;path=/;';
			}
			if (saved[document.location]) {
				document.forms.post.body.value = saved[document.location];
			}
		}
		
		if (localStorage.body) {
			document.forms.post.body.value = localStorage.body;
			localStorage.body = '';
		}
	}
}

function init() {
	if (document.forms.postcontrols) {
		document.forms.postcontrols.password.value = localStorage.password;
	}
	
	if (window.location.hash.indexOf('q') != 1 && window.location.hash.substring(1))
		highlightReply(window.location.hash.substring(1));
}

// Disables all img tags in some html
function mogrifyHTML(html) {
	html = html.replace(/(<img\b[^>]*\s)(src\s*=)/g, '$1data-$2');
	return html;
}

// Re-enables img tags in an element
function demogrifyEl($el) {
	$el.find('img').each(function() {
		var realsrc = $(this).attr('data-src');
		if (realsrc) {
			$(this).attr('src', realsrc);
		}
	});
}

$(document).bind('new_post', function(e, post) {
	demogrifyEl($(post));
});

var RecaptchaOptions = {
	theme : 'clean'
};

$(document).ready(init);
