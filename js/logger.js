function nop() {}

if (typeof console == "undefined" || !console) {
	console = {};
	console.log = nop;
	console.error = nop;
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

function send_error(error, retryTime) {
	if (!error.hasOwnProperty("message")) {
		log_error("send_error called without error.message");
	}
	error.pageurl = document.location.href;
	
	var errorString = JSON.stringify(error);
	var url = siteroot + 'logger.php';
	var data = {type: "error", userid: userid, data: errorString};
	
	var maxRetryTime = 3*60*1000;
	if (!retryTime)
		retryTime = 3*1000;
	else if (retryTime > maxRetryTime)
		retryTime = maxRetryTime;
	
	$.ajax({
		url: url,
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
