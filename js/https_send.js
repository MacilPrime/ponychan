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
	
	function sendData() {
		var data = getData();
		var $if = $('<iframe/>')
			.attr({id:'httpsif', src:'https://mlpchan.net'+siteroot+'https_receive.html'})
			.css({visibility:'hidden', width:'2px', height:'2px'})
			.load(function() {
				this.contentWindow.postMessage(data, 'https://mlpchan.net');
			})
			.appendTo(document.body);
	}
	exports.sendData = sendData;
	
	function receiveMessage(event) {
		if (event.origin !== 'https://mlpchan.net') return;
		
		console.log("https iframe response:", event.data);
		if (event.data.success) {
			localStorage.last_https_send = Date.now();
		} else {
			send_error({message:"bad https iframe response",response:event.data});
		}
	}
	window.addEventListener("message", receiveMessage, false);
	
	$(document).ready(function() {
		if (window.postMessage && document.location.protocol != "https:") {
			if (localStorage.last_https_send == null ||
			    parseInt(localStorage.last_https_send) + 25*60*1000 < Date.now()) {
				sendData();
			}
		}
	});
})(window.https_send||(window.https_send={}));
