function nop() {}

if (typeof console == "undefined" || !console) {
	console = {};
	console.log = nop;
	console.info = nop;
	console.warn = nop;
	console.error = nop;
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

function send_error(error, retryTime) {
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

function log_error(message) {
	console.error(message);
	send_error({message: message});
}

var old_onerror = window.onerror;

var error_handler_nest_count = 0;
window.onerror = function(errorMsg, url, lineNumber) {
	if (error_handler_nest_count <= 1) {
		error_handler_nest_count++;
		
		var error = {message: errorMsg, url: url, lineNumber: lineNumber};
		send_error(error);
		
		error_handler_nest_count--;
	}
	if (old_onerror)
		return old_onerror(errorMsg, url, lineNumber);
	return false;
};

function send_usage(retryTime) {
	var usage = {};
	
	usage.settings = settings.getAllSettings();
	
	usage.supportFile = typeof FileReader != "undefined" && !!FileReader;
	usage.supportFormData = typeof FormData != "undefined" && !!FormData;
	usage.supportPostMessage = typeof window.postMessage != "undefined" && !!window.postMessage;
	usage.supportWorker = typeof Worker != "undefined" && !!Worker;
	usage.supportSharedWorker = typeof SharedWorker != "undefined" && !!SharedWorker;
	usage.supportWindowScrollTo = typeof window.scrollTo != "undefined" && !!window.scrollTo;
	usage.supportCanvas = !!window.HTMLCanvasElement;
	
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
$(document).ready(function() {
	setTimeout(send_usage, 300);
});
