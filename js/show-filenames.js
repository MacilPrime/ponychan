$(document).ready(function() {
	var filename_expander = function(context) {
		$(".postfilename[title], .postfilename[data-fn-fullname]", context).each(function() {
			var $fn = $(this);
			var shortname = $fn.attr("data-fn-shortname") || $fn.text();
			var fullname = $fn.attr("title") || $fn.attr("data-fn-fullname");
			$fn
				.removeAttr("title")
				.attr("data-fn-shortname", shortname)
				.attr("data-fn-fullname", fullname)
				.text(shortname)
				.hover(function() {
					$fn.text(fullname);
				}, function() {
					$fn.text(shortname);
				});
		});
	};

	filename_expander(document);
	$(document).bind('new_post', function(e, post) {
		filename_expander(post);
	});
});
