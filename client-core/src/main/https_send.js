import _ from 'lodash';
import $ from 'jquery';
import {log_error} from './logger';
import settings from './settings';

function getSettings() {
	return _.chain(settings.getAllSettingValues(true))
		.pairs()
		.map(([name, value]) => [name, localStorage.getItem('setting_'+name)])
		.filter(([name, value]) => value != null)
		.zipObject()
		.value();
}

function getData() {
	const data = {
		userid: localStorage.getItem('userid'),
		settings: getSettings(),
		watched_threads: JSON.parse(localStorage.getItem("watched_threads"))
	};
	if (localStorage.name != null) {
		data.name = localStorage.name;
	}
	if (localStorage.email != null) {
		data.email = localStorage.email;
	}
	if (localStorage.password != null) {
		data.password = localStorage.password;
	}
	return data;
}

let receivedResponse = false;

function sendData() {
	let iframeLoaded = false;
	const data = getData();
	const $if = $('<iframe/>')
		.attr({id:'httpsif', src:'https://www.ponychan.net'+SITE_DATA.siteroot+'https_receive.html?v=2'})
		.css({visibility:'hidden', width:'2px', height:'2px'})
		.load(function() {
			iframeLoaded = true;
			data.https_transit_content = true;
			this.contentWindow.postMessage(data, 'https://www.ponychan.net');
			setTimeout(function() {
				if (!receivedResponse)
					log_error("https iframe response timeout");
			}, 15*1000);
		})
		.appendTo(document.body);
	setTimeout(function() {
		if (!iframeLoaded)
			log_error("https iframe load timeout");
	}, 15*1000);
}

function receiveMessage(event) {
	if (event.origin !== 'https://mlpchan.net') return;
	if (!event.data.https_transit_response) return;

	receivedResponse = true;

	console.log("https iframe response:", event.data);
	if (event.data.success) {
		localStorage.setItem('last_https_send', Date.now());
	} else {
		log_error({message:"bad https iframe response",response:event.data});
	}
}
window.addEventListener("message", receiveMessage, false);

$(document).ready(function() {
	if (
		window.postMessage && window.localStorage &&
    document.location.origin !== 'https://www.ponychan.net'
	) {
		const last_https_send = localStorage.getItem('last_https_send');
		if (last_https_send == null || parseInt(last_https_send) + 25*60*1000 < Date.now()) {
			sendData();
		}
	}
});
