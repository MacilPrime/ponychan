(function(exports) {
	function settingsAd(text, time) {
		return pop(text+' \u2191', time);
	}
	exports.settingsAd = settingsAd;

	function pop(text, time) {
		if (time === undefined) time = 30;
		
		var $navbar = $(".boardlist.top").first();
		var $notice = $("<div/>")
			.appendTo(document.body)
			.hide()
			.addClass("popnotice")
			.text(text)
			.css("top", $navbar.height()+"px");
		
		var hasFaded = false;
		
		function fadeNow() {
			if (hasFaded)
				return;
			hasFaded = true;
			$notice.fadeOut(function() {
				$notice.remove();
			});
		}
		
		$notice.click(fadeNow);
		
		setTimeout(function() {
			$notice.fadeIn();
			if (time)
				setTimeout(fadeNow, time*1000);
		}, 1500);
	}
	exports.pop = pop;
})(window.notice||(window.notice={}));
