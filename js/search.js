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

		var _catalog_loading_promise = null;

		// Loads the catalog in the background if it's not loaded already.
		// Returns a promise that resolves when the catalog element has been added to the page.
		function initSearch() {
			if (_catalog_loading_promise)
				return _catalog_loading_promise;
			
			var job = Q.defer();
			_catalog_loading_promise = job.promise;
			
			if (!$catalog.length) {
				$.ajax({
					url: siteroot+board_id+'/catalog.html',
					success: function(data) {
						var $html = $($.parseHTML(data));
						$catalog = $html.filter('.catalog').add( $html.find('.catalog') )
							.first()
							.insertAfter($controlsform)
							.hide();
						job.resolve();
					},
					error: function(jqXHR, textStatus, errorThrown) {
						console.error("Failed to load catalog. textStatus:", textStatus, "errorThrown:", errorThrown);
						job.reject(new Error(errorThrown));
					}
				});
			} else {
				job.resolve();
			}
			return job.promise;
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
			
			initSearch().done(function() {
				var text = $textbox.val();
				if (text == currentSearch) return;
				var $nofound = $('#searchnofound');
				if (text.length == 0) {
					if (settings.getSetting("show_mature"))
						$(".catathread").show();
					else
						$(".catathread:not(.mature_thread)").show();
					$nofound.hide();
					if ($controlsform.length) {
						$catalog.hide();
						$controlsform.show();
					}
				} else {
					if ($controlsform.length) {
						$controlsform.hide();
						$catalog.show();
					}
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
			}, function(error) {
				$status.text("Failed to retrieve catalog, try refreshing the page");
			});
		}

		$textbox
			.click(function() {initSearch().then(nop, nop);})
			.on('input', queueSearch)
			.change(search);
	});
})(window.search||(window.search={}));
