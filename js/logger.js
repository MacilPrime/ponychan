/*
 * logger.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

function nop() {}

if (typeof console == "undefined" || !window.console) {
	console = {
		log: nop,
		info: nop,
		warn: nop,
		error: nop
	};
}

function basicStringHash(string, prevHash){
	var hash = 0;
	if (prevHash)
		hash = prevHash;
	if (string.length == 0) return hash;
	for (i = 0; i < string.length; i++) {
		var char = string.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

function hashCode(x, prevHash){
	if (typeof x === "object" && x !== null) {
		var hash = 0;
		if (prevHash)
			hash = prevHash;
		
		var keys = [];
		$.each(x, function(key, value) {
			keys.push(key);
		});
		keys.sort();
		
		hash = basicStringHash("object:len:"+keys.length, hash);
		$.each(keys, function(i, key) {
			hash = basicStringHash(";"+i+key+":", hash);
			hash = hashCode(x[key], hash);
		});
		return hash;
	} else {
		return basicStringHash((typeof x)+":"+x, prevHash);
	}
}

function createID() {
	var id = "";
	var hexDigits = "0123456789abcdef";
	for (var i = 0; i < 32; i++) {
		id += hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	return id;
}

var userid, olduserid;
if (typeof localStorage != "undefined" && !!localStorage) {
	userid = localStorage.getItem("userid");
	if (userid && userid.length == 16) {
		olduserid = userid;
		try {
			localStorage.setItem("olduserid", olduserid);
		} catch(e) {}
	} else {
		olduserid = localStorage.getItem("olduserid");
	}
}
var user_is_noob = !userid;
if (!userid || userid.length != 32) {
	userid = createID();
	try {
		localStorage.setItem("userid", userid);
	} catch (e) {}
}
var expires = new Date();
expires.setTime((new Date).getTime()+60480000000)
document.cookie = "userid="+escape(userid)+"; expires="+expires.toGMTString()+"; path="+siteroot;

var maxRetryTime = 3*60*1000;
var logger_url = siteroot + 'logger.php';

var noSendBefore = 0;
var noSendDelay = 10;
var send_queued = 0;
var send_maxQueued = 7;
var malformed_errors = {};

function error_to_object(error) {
	var newError = {message: error.message, url: error.fileName, lineNumber: error.lineNumber};
	if (error.constructor && error.constructor.name)
		newError.type = error.constructor.name;
	// get anything missed. For some reason error.message doesn't show up in this pass.
	for (var prop in error) {
		if (!error.hasOwnProperty(prop)) continue;
		var newProp;
		if (prop == "fileName")
			newProp = "url";
		else
			newProp = prop;
		newError[newProp] = error[prop];
	}
	return newError;
}

function send_error(error, retryTime) {
	if (typeof error === "string")
		error = {message: error};
	else if (error instanceof Error)
		error = error_to_object(error);
	
	error.pageurl = document.location.href;
	var errorString = JSON.stringify(error);
	var data = {type: "error", userid: userid, data: errorString};
		
	if (!error.hasOwnProperty("message") && !malformed_errors.hasOwnProperty(errorString)) {
		malformed_errors[errorString] = true;
		log_error("send_error called without error.message");
	}
	
	var now = (new Date()).getTime();
	if (now < noSendBefore) {
		if (send_queued < send_maxQueued) {
			send_queued++;
			setTimeout(function() {
				send_queued--;
				send_error(error, retryTime);
			}, noSendBefore-now+10);
		}
		return;
	}
	
	if (!retryTime)
		retryTime = 3*1000;
	else if (retryTime > maxRetryTime)
		retryTime = maxRetryTime;
	
	noSendBefore = now + noSendDelay;

	noSendDelay *= 2;
	if (noSendDelay > maxRetryTime)
		noSendDelay = maxRetryTime;
	
	$.ajax({
		url: logger_url,
		cache: false,
		data: data,
		type: 'POST',
		success: function(data) {
			console.log("sent javascript error report to server for review");
		},
		error: function(jqXHR, textStatus, errorThrown) {
			if (textStatus == "timeout") {
				console.log("timeout while trying to send error report, retrying soon");
				setTimeout(function() {
					send_error(error, retryTime*2);
				}, retryTime);
			} else {
				console.error("could not send error report. textStatus: "+textStatus+", errorThrown: "+errorThrown);
			}
		}
	});
}

function log_error(error) {
	console.error(error);
	send_error(error);
}

var old_onerror = window.onerror;

var error_handler_nest_count = 0;
window.onerror = function(errorMsg, url, lineNumber) {
	if (error_handler_nest_count <= 1) {
		error_handler_nest_count++;
		
		var error = {message: errorMsg, url: url, lineNumber: lineNumber, caughtBy: "window.onerror"};
		send_error(error);
		
		error_handler_nest_count--;
	}
	if (old_onerror)
		return old_onerror(errorMsg, url, lineNumber);
	return false;
};

function send_usage(retryTime) {
	
	// localStorage is used to know if we've already sent in a
	// usage report to not spam the system.
	if (!window.localStorage) return;
	
	var usage = {};
	
	usage.settings = settings.getAllSettings(true);
	
	usage.supportFile = typeof FileReader != "undefined" && !!FileReader;
	usage.supportFormData = typeof FormData != "undefined" && !!FormData;
	usage.supportPostMessage = typeof window.postMessage != "undefined" && !!window.postMessage;
	usage.supportWorker = typeof Worker != "undefined" && !!Worker;
	usage.supportSharedWorker = typeof SharedWorker != "undefined" && !!SharedWorker;
	usage.supportWindowScrollTo = typeof window.scrollTo != "undefined" && !!window.scrollTo;
	usage.supportCanvas = !!window.HTMLCanvasElement;
	usage.supportVisibility = Visibility.isSupported();
	
	var wURL = window.URL || window.webkitURL;
	usage.supportwURL = typeof wURL != "undefined" && !!wURL;
	
	usage.supportGetSelection = typeof window.getSelection != "undefined" && !!window.getSelection;
	
	if (olduserid)
		usage.olduserid = olduserid;
	
	if (document.location.protocol == 'http:') {
		usage.http_user = true;
		if (localStorage.last_https_send)
			usage.last_https_send = parseInt(localStorage.last_https_send);
	}
	
	// usage object construction end
	
	var last_usage_hash_key = "last_usage_data:"+siteroot;

	var usageHash = hashCode(userid + hashCode(usage))
	if (usageHash == localStorage.getItem(last_usage_hash_key))
		return;
	
	var usageString = JSON.stringify(usage);
	
	var data = {type: "usage", userid: userid, data: usageString};
	
	if (!retryTime)
		retryTime = 3*1000;
	else if (retryTime > maxRetryTime)
		retryTime = maxRetryTime;
	
	$.ajax({
		url: logger_url,
		cache: false,
		data: data,
		type: 'POST',
		success: function(data) {
			try {
				localStorage.setItem(last_usage_hash_key, usageHash);
			} catch(e) {}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			if (textStatus == "timeout") {
				setTimeout(function() {
					send_usage(retryTime*2);
				}, retryTime);
			}
		}
	});
}

function send_misc(misc, retryTime) {
	if (typeof misc !== 'object')
		misc = {value: misc};
	misc.pageurl = document.location.href;
	var miscString = JSON.stringify(misc);
	var data = {type: "misc", userid: userid, data: miscString};
	
	if (!retryTime)
		retryTime = 3*1000;
	else if (retryTime > maxRetryTime)
		retryTime = maxRetryTime;
	
	$.ajax({
		url: logger_url,
		cache: false,
		data: data,
		type: 'POST',
		success: function(data) {
			//console.log("sent misc message to server");
		},
		error: function(jqXHR, textStatus, errorThrown) {
			if (textStatus == "timeout") {
				console.log("timeout while trying to send misc message, retrying soon");
				setTimeout(function() {
					send_misc(misc, retryTime*2);
				}, retryTime);
			} else {
				console.error("could not send misc message. textStatus: "+textStatus+", errorThrown: "+errorThrown);
			}
		}
	});
}

var _misc_log_rapid_data = [];
var _misc_log_rapid_timer = null;
function misc_log_rapid(data) {
	_misc_log_rapid_data.push([Date.now(), data]);
	
	if (!_misc_log_rapid_timer) {
		_misc_log_rapid_timer = setTimeout(function() {
			send_misc({type:"rapid", log:_misc_log_rapid_data});
			_misc_log_rapid_timer = null;
			_misc_log_rapid_data = [];
		}, 15*1000);
	}
}

$(document).ready(function() {
	setTimeout(send_usage, 300);
});
