(function(exports) {
	function settingsAd(text, time, cb) {
		return pop(text+' \u2191', time, cb);
	}
	exports.settingsAd = settingsAd;

	function pop(text, time, cb) {
		if (time === undefined) time = 30;
		
		var $navbar = $(".boardlist.top").first();
		var $notice = $("<div/>")
			.appendTo(document.body)
			.hide()
			.addClass("popnotice")
			.text(text)
			.css("top", $navbar.height()+"px");
		
		var hasFaded = false;
		var hasCalled = false;
		
		function fadeNow() {
			if (hasFaded)
				return;
			hasFaded = true;
			$notice.fadeOut(function() {
				$notice.remove();
			});
			if (cb)
				doCall();
		}
		function doCall() {
			if (hasCalled)
				return;
			hasCalled = true;
			cb();
		}
		
		$notice.click(fadeNow);
		
		setTimeout(function() {
			$notice.fadeIn(function() {
				if (cb)
					setTimeout(doCall, 5*1000);
				
				if (time)
					setTimeout(fadeNow, time*1000);
			});
		}, 1500);
	}
	exports.pop = pop;
})(window.notice||(window.notice={}));
