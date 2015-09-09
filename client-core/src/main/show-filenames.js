/*
 * show-filenames.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

var $ = require('jquery');
var _ = require('lodash');

var supportsDownloadAttr = _.once(function() {
	var link = document.createElement('a');
	return 'download' in link;
});

$(document).ready(function() {
	function filename_expander(context) {
		$(".post-filename[data-fn-fullname]", context).each(function() {
			var $fn = $(this);
			var shortname = $fn.attr("data-fn-shortname") || $fn.text();
			var fullname = $fn.attr("data-fn-fullname");
			$fn
				.attr("data-fn-shortname", shortname)
				.attr("data-fn-fullname", fullname)
				.text(shortname)
				.hover(function() {
					$fn.text(fullname);
				}, function() {
					$fn.text(shortname);
				});
		});

		if (!supportsDownloadAttr()) {
			$("a.post-filename[title][download]", context).removeAttr('title');
		}
	}

	filename_expander(document);
	$(document).on('new_post.showfn', function(e, post) {
		filename_expander(post);
	});
});
