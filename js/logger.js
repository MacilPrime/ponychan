function nop() {}

if (typeof console == "undefined" || !console) {
	console = {};
	console.log = nop;
	console.error = nop;
}

String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

function createID() {
	var id = "";
	var hexDigits = "0123456789abcdef";
	for (var i = 0; i < 16; i++) {
		id += hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	return id;
}

var userid;
if (typeof localStorage != "undefined" && localStorage) {
	userid = localStorage.getItem("userid");
}
if (!userid) {
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
function send_error(error, retryTime) {
	if (!error.hasOwnProperty("message")) {
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
	
	error.pageurl = document.location.href;
	
	var errorString = JSON.stringify(error);
	var data = {type: "error", userid: userid, data: errorString};
	
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
	
	usage.supportFile = typeof DataTransfer != "undefined" && DataTransfer != null && "files" in DataTransfer.prototype;
	usage.supportFormData = typeof FormData != "undefined" && FormData != null;
	
	var wURL = window.URL || window.webkitURL;
	usage.supportwURL = typeof wURL != "undefined" && wURL != null;
	
	usage.supportGetSelection = typeof window.getSelection != "undefined" && window.getSelection != null;
	
	var usageString = JSON.stringify(usage);
	
	var usageHash = (userid + usageString).hashCode()
	if (usageHash == localStorage.getItem("last_usage_data"))
		return;
	
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
				localStorage.setItem("last_usage_data", usageHash);
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
