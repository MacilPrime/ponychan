/*
 * show-filenames.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

$(document).ready(function() {
	function filename_expander(context) {
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
	}
	
	filename_expander(document);
	$(document).on('new_post.showfn', function(e, post) {
		filename_expander(post);
	});
});
