function processMessage(data) {
	if (typeof data.userid !== "string" || !/^[0-9a-f]{32}$/.exec(data.userid))
		return {error: "Bad userid"};
	localStorage.olduserid = data.userid;
	
	if (data.hasOwnProperty("name")) {
		if (typeof data.name !== "string" || data.name.length > 75)
			return {error: "Bad name"};
		if (localStorage.name == null)
			localStorage.name = data.name;
	}
	
	if (data.hasOwnProperty("email")) {
		if (typeof data.email !== "string" || data.email.length > 254)
			return {error: "Bad email"};
		if (localStorage.email == null)
			localStorage.email = data.email;
	}
	
	if (data.hasOwnProperty("password")) {
		if (typeof data.password !== "string" || data.password.length > 75)
			return {error: "Bad password"};
		if (localStorage.password == null)
			localStorage.password = data.password;
	}
	
	if (typeof data.settings !== "object" || Object.keys(data.settings).length > 20)
		return {error: "Bad settings"};
	
	for (var setting in data.settings) {
		if (!data.settings.hasOwnProperty(setting)) continue;
		
		if (setting.length > 50)
			return {error: "Bad setting name: "+setting};
		
		var sid = "setting_"+setting;
		if (localStorage.getItem(sid) == null) {
			var sval = data.settings[setting];
			if (sval == null) continue;
			if (typeof sval === "string" && sval.length > 20)
				return {error: "Bad setting: "+sid};
			localStorage.setItem(sid, data.settings[setting]);
		}
	}
	
	if (data.hasOwnProperty("watched_threads")) {
		if (typeof data.watched_threads !== "object" || Object.keys(data.watched_threads).length > 30)
			return {error: "Bad watched_threads"};
		
		var watched_threads;
		if (localStorage.watched_threads)
			watched_threads = JSON.parse(localStorage.watched_threads);
		else
			watched_threads = {};
		
		for (var tid in data.watched_threads) {
			if (!data.watched_threads.hasOwnProperty(tid)) continue;
			if (watched_threads.hasOwnProperty(tid)) continue;
			if (Object.keys(watched_threads).length >= 30) break;
			watched_threads[tid] = data.watched_threads[tid];
		}
		localStorage.watched_threads = JSON.stringify(watched_threads);
	}
	
	return {success: true};
}

function receiveMessage(event) {
	if (document.location.protocol !== 'https:') return;
	
	var intended = "http://mlpchan.net";
	if (event.origin !== intended) return;
	
	var response;
	try {
		response = processMessage(event.data);
	} catch(e) {
		response = {error: e};
	}
	event.source.postMessage(response, intended);
}

window.addEventListener("message", receiveMessage, false);
