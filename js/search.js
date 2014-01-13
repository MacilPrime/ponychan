/*
 * search.js
 *
 * Released under the MIT license
 * Copyright (c) 2014 Macil Tech <maciltech@gmail.com>
 *
 */

(function(exports) {
	$(document).ready(function() {
		// don't run inside threads
		if ($('div.banner').length)
			return;

		var $controlsform = $("form[name='postcontrols']");
		var $catalog = $(".catalog");
		
		// Only run if we're on the catalog
		if (!$catalog.length)
			return;

		var $searchdiv = $("<div/>")
			.addClass("searchblock")
			.insertAfter($("header").first());
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

		// Loads the catalog in the background if it's not loaded already
		function initSearch() {
		}
		
		// queues up a call to search
		function queueSearch() {
			if (queuedSearchTimer) return;
			queuedSearchTimer = setTimeout(search, queuedSearchDelay);
		}
		
		// does the search and shows threads
		function search() {
			clearTimeout(queuedSearchTimer);
			queuedSearchTimer = null;
			
			var text = $textbox.val();
			if (text == currentSearch) return;
			console.log("TEXT:", text);
			var $nofound = $('#searchnofound');
			if (text.length == 0) {
				if (settings.getSetting("show_mature"))
					$(".catathread").show();
				else
					$(".catathread:not(.mature_thread)").show();
				$nofound.hide();
			} else {
				var terms = searchTermSplitter(text);
				var countfound = 0;
				$(".catathread").each(function() {
					var $this = $(this);
					var thistext = $this.text().toLowerCase();
					var matchfound = true;
					if ($this.hasClass("mature_thread") && !settings.getSetting("show_mature")) {
						matchfound = false;
					} else {
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
					}
					if (matchfound) {
						$this.show();
						countfound++;
					} else {
						$this.hide();
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
		}

		$textbox
			.click(initSearch)
			.on('input', queueSearch)
			.change(search);
	});
})(window.search||(window.search={}));
