/*
 * search.js
 *
 * Released under the MIT license
 * Copyright (c) 2014 Macil Tech <maciltech@gmail.com>
 *
 */

var RSVP = require('rsvp');
var _ = require('underscore');

(function(exports) {
	$(document).ready(function() {
		// don't run inside threads
		if ($('div.banner').length)
			return;

		var $controlsform = $("form[name='postcontrols']");
		var $catalog = $(".catalog");

		// Only run if we're on the catalog or board index
		if (!$catalog.length && !$controlsform.length)
			return;

		var $searchdiv = $("<div/>")
			.addClass("searchblock")
			.insertAfter($("header").first());
		var $status = $("<span/>")
			.addClass("searchstatus")
			.appendTo($searchdiv);
		var $textbox = $("<input/>")
			.attr("id", "threadsearchbox")
			.attr("type", "text")
			.attr("placeholder", "Search")
			.attr("maxlength", 75)
			.appendTo($searchdiv);

		// Stores the string of the currently rendered search.
		// Is falsey if there is no current search.
		var currentSearch = null;

		var queuedSearchDelay = 150;
		var queuedSearchTimer = null;

		// returns an array of search terms
		function searchTermSplitter(text) {
			var terms = [];
			var split = text.split(" ");
			for (var i=0; i<split.length; i++) {
				var s = split[i].toLowerCase().trim();
				if (s.length)
					terms.push(s);
			}
			return terms;
		}

		// Loads the catalog in the background if it's not loaded already.
		// Returns a promise that resolves when the catalog element has been added to the page.
		var initSearch = _.memoize(function() {
			return new RSVP.Promise(function(resolve, reject) {
				if (!$catalog.length) {
					$.ajax({
						url: siteroot+board_id+'/catalog.html',
						success: function(data) {
							var $html = $($.parseHTML(data));
							$catalog = $html.filter('.catalog').add( $html.find('.catalog') )
								.first()
								.insertAfter($controlsform)
								.hide();
							resolve();
						},
						error: function(jqXHR, textStatus, errorThrown) {
							console.error("Failed to load catalog. textStatus:", textStatus, "errorThrown:", errorThrown);
							reject(new Error(errorThrown));
						}
					});
				} else {
					resolve();
				}
			});
		});

		// queues up a call to search
		function queueSearch() {
			if (queuedSearchTimer) return;
			queuedSearchTimer = setTimeout(search, queuedSearchDelay);
		}

		// does the search and shows threads
		function search() {
			clearTimeout(queuedSearchTimer);
			queuedSearchTimer = null;

			initSearch().done(function() {
				var text = $textbox.val();
				if (text == currentSearch) return;
				var $nofound = $('#searchnofound');
				if (text.length == 0) {
					$(".searchhidden").removeClass("searchhidden");
					$nofound.hide();
					if ($controlsform.length) {
						$catalog.hide();
						$controlsform.show();
						$(".pages").show();
					}
				} else {
					if ($controlsform.length) {
						$controlsform.hide();
						$(".pages").hide();
						$catalog.show();
					}
					var terms = searchTermSplitter(text);
					var countfound = 0;
					$(".catathread").each(function() {
						var $this = $(this);
						var thistext = $this.text().toLowerCase();
						var matchfound = true;
						for (var i=0; i<terms.length; i++) {
							if (terms[i][0] == "-") {
								var t = terms[i].slice(1);
								if (t.length && thistext.indexOf(t) != -1) {
									matchfound = false;
									break;
								}
							} else {
								if (thistext.indexOf(terms[i]) == -1) {
									matchfound = false;
									break;
								}
							}
						}
						if (matchfound) {
							$this.removeClass("searchhidden");
							countfound++;
						} else {
							$this.addClass("searchhidden");
						}
					});
					if (countfound == 0) {
						if (!$nofound.length) {
							$nofound = $("<div/>")
								.attr("id", "searchnofound")
								.text("Nothing found")
								.appendTo($catalog);
						}
						$nofound.show();
					} else {
						$nofound.hide();
					}
				}
				currentSearch = text;
			}, function(error) {
				$status.text("Failed to retrieve catalog, try refreshing the page");
			});
		}

		$textbox
			.click(function() {initSearch().then($.noop, $.noop);})
			.on('input', queueSearch)
			.change(search);
	});
})(window.search||(window.search={}));
