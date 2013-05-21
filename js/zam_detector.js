// Anagram detector
// for better witch hunting

(function(exports) {
	settings.newSetting("zam_detector", "bool", false, "Automatic Zamoonda Detector®", 'pagestyle', {orderhint:19});

	function char_counts(s) {
		var c = {};
		for (var i=0; i<s.length; i++) {
			if (c.hasOwnProperty(s[i]))
				c[ s[i] ]++;
			else
				c[ s[i] ] = 1;
		}
		return c;
	}
	exports.char_counts = char_counts;

	function anagram_rating(s1, s2) {
		var total = (s1.length + s2.length);
		var diff = 0;
		var c1 = char_counts(s1);
		var c2 = char_counts(s2);
		for (var chr in c1) {
			if (c2.hasOwnProperty(chr))
				diff += Math.abs(c1[chr] - c2[chr]);
			else
				diff += c1[chr];
		}
		for (var chr in c2) {
			if (!c1.hasOwnProperty(chr))
				diff += c2[chr];
		}
		return 1-diff/total;
	}
	exports.anagram_rating = anagram_rating;

	var zdr_cache = {};
	function zdr(name) {
		name = name.trim().toLowerCase();
		if (zdr_cache.hasOwnProperty(name))
			return zdr_cache[name];
		var bad = "zamoonda";
		var rating;
		if (name == "aurroria")
			rating = 1;
		else
			rating = anagram_rating(name, bad);
		zdr_cache[name] = rating;
		return rating;
	}
	exports.zdr = zdr;

	$(document).ready(function(){
		var zam_mode = settings.getSetting("zam_detector");
		
		$(document).on("setting_change", function(e, setting) {
			if (setting === "zam_detector") {
				zam_mode = settings.getSetting("zam_detector");
				zam_detector(document);
			}
		});
		
		zam_detector(document);
		$(document).on('new_post.zam', function(e, post) {
			zam_detector(post);
		});
		
		function zam_detector(context) {
			if (!zam_mode) {
				$(".zam_note", context).remove();
				return;
			}
			$(".namepart", context).each(function() {
				if ($(this).parent().children(".zam_note").length) return;
				
				var name = $(".name", this).first().text();
				var rating = Math.round(zdr(name) * 100);
				var $zn = $("<span/>")
					.addClass("zam_note")
					.html(' <abbr title="Zamoonda Detector® Rating">ZDR</abbr>: ');
				if (rating == 100) $zn.addClass("zam_rating_critical");
				var $zr = $("<span/>").addClass("zam_rating").text(rating+"%");
				$zn.append($zr);
				$(this).after($zn);
			});
		}
	});
})(window.zam_detector||(window.zam_detector={}));
