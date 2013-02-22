settings.newProp("mod_obscure_ips", "bool", false, "Obscure user IP addresses");

$(document).ready(function() {
	var obscure_ips = settings.getProp("mod_obscure_ips");
	
	var processIPs = function(context) {
		if (obscure_ips) {
			$(".posterip a", context).text("IP").addClass('ip-hidden');
		} else {
			$("a.ip-hidden", context).each(function() {
				var $this = $(this);
				var m = /^\?\/IP\/(.*)$/.exec($this.attr('href'));
				$this.text(m[1]);
			});
		}
	}

	processIPs(document);

	$(document).on("setting_change", function(e, setting) {
		if (setting === "mod_obscure_ips") {
			obscure_ips = settings.getProp("mod_obscure_ips");
			processIPs(document);
		}
	});

	$(document).on('new_post', function(e, post) {
		processIPs(post);
	});
});
