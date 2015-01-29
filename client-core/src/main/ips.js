/*
 * ips.js
 *
 * Released under the WTFPLv2 license
 *
 */

settings.newSetting("mod_obscure_ips", "bool", true, "Obscure user IP addresses", 'mod', {orderhint:1});

$(document).ready(function() {
	if (document.location.href.match(/\/mod\.php\?\/IP\//)) {
		return;
	}

	var obscure_ips = settings.getSetting("mod_obscure_ips");

	function getIPfromlink($a) {
		var m = /\?\/IP\/(.*)$/.exec($a.attr('href'));
		return m ? m[1] : "Error";
	}

	function processIPs(context) {
		if (obscure_ips) {
			$(".posterip a", context)
				.text("IP")
				.addClass('ip-hidden')
				.on('mouseenter.iphider', function() {
					var $this = $(this);
					$this.text(getIPfromlink($this));
				})
				.on('mouseleave.iphider', function() {
					var $this = $(this);
					$this.text("IP");
				});
		} else {
			$("a.ip-hidden", context).each(function() {
				var $this = $(this);
				$this
					.text(getIPfromlink($this))
					.removeClass('ip-hidden')
					.off('.iphider');
			});
		}
	}

	processIPs(document);

	$(document).on("setting_change", function(e, setting) {
		if (setting === "mod_obscure_ips") {
			obscure_ips = settings.getSetting("mod_obscure_ips");
			processIPs(document);
		}
	});

	$(document).on('new_post', function(e, post) {
		processIPs(post);
	});
});
