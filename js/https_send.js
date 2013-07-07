(function(exports) {
	function getData() {
		var data = {};
		data.userid = userid;
		if (localStorage.name != null)
			data.name = localStorage.name;
		if (localStorage.email != null)
			data.email = localStorage.email;
		if (localStorage.password != null)
			data.password = localStorage.password;
		data.settings = settings.getAllSettings(true);
		data.watched_threads = watched_threads;
		return data;
	}
	exports.getData = getData;
	
	var receivedResponse = false;
	
	function sendData() {
		var iframeLoaded = false;
		var data = getData();
		var $if = $('<iframe/>')
			.attr({id:'httpsif', src:'https://mlpchan.net'+siteroot+'https_receive.html?v=2'})
			.css({visibility:'hidden', width:'2px', height:'2px'})
			.load(function() {
				iframeLoaded = true;
				data['https_transit_content'] = true;
				this.contentWindow.postMessage(data, 'https://mlpchan.net');
				setTimeout(function() {
					if (!receivedResponse)
						log_error("https iframe response timeout");
				}, 5*1000);
			})
			.appendTo(document.body);
		setTimeout(function() {
			if (!iframeLoaded)
				log_error("https iframe load timeout");
		}, 5*1000);
	}
	exports.sendData = sendData;
	
	function receiveMessage(event) {
		if (event.origin !== 'https://mlpchan.net') return;
		if (!event.data['https_transit_response']) return;
		
		receivedResponse = true;
		
		console.log("https iframe response:", event.data);
		if (event.data.success) {
			localStorage.last_https_send = Date.now();
		} else {
			send_error({message:"bad https iframe response",response:event.data});
		}
	}
	window.addEventListener("message", receiveMessage, false);
	
	$(document).ready(function() {
		if (window.postMessage && window.localStorage &&
		    document.location.protocol != "https:") {
			if (localStorage.last_https_send == null ||
			    parseInt(localStorage.last_https_send) + 25*60*1000 < Date.now()) {
				sendData();
			}
		}
	});
})(window.https_send||(window.https_send={}));
