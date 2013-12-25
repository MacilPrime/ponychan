/*
 * mc.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 * Shows number of players currently online on the minecraft server
 *
 */

(function(exports) {
	var MC_POLL_TIME = 2*60*1000;
	var MC_MAX_CACHE_TIME = 3*60*1000;
	var MC_STALE_TIME = 5*60*1000;
	
	var lastCount = null;
	var staleTimer = null;
	
	function updateMessage(count) {
		clearTimeout(staleTimer);
		
		if (count > 0) {
			if (count != lastCount) {
				var message = count+" player"+(count==1 ? "" : "s")+" online now.";
				$(".mcplayercount").text(message);
			}
			
			// Clear outdated count
			staleTimer = setTimeout(function() {
				$(".mcplayercount").text("");
			}, MC_STALE_TIME);
		} else {
			if (count != lastCount) {
				$(".mcplayercount").text("");
			}
		}
		
		lastCount = count;
	}
	
	function getOnlineCount(callback) {
		$.ajax({
			url: '/mcserver/json/playercount',
			dataType: "json",
			success: function(data) {
				if (data.error) {
					console.log("mcserverstatus error: "+data.error)
					return;
				}
				if (typeof data.playercount === "number") {
					var mc_online_players = {time: Date.now(), count: data.playercount};
					if (window.sessionStorage) {
						try {
							sessionStorage.setItem("mc_online_players", JSON.stringify(mc_online_players));
						} catch(e) {}
					}
					updateMessage(mc_online_players.count);
				}
				if (callback)
					callback(true);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (textStatus == "abort")
					return;
				console.log("Error retrieving mcserverstatus");
				if(callback)
					callback(false);
			}
		});
	}
	
	function countUpdater() {
		getOnlineCount(function() {
			setTimeout(countUpdater, MC_POLL_TIME);
		});
	}
	
	$(document).ready(function() {
		if ($(".mcplayercount").length == 0)
			return;
		
		if (window.sessionStorage && sessionStorage.mc_online_players != null) {
			var mc_online_players = JSON.parse(sessionStorage.mc_online_players);
			if (Date.now() - mc_online_players.time < MC_MAX_CACHE_TIME) {
				updateMessage(mc_online_players.count);
			}
		}
		
		countUpdater();
	});
})(window.mc||(window.mc={}));
