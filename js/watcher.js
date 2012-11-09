/*
 * watcher.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/watcher.js';
 *
 */

var max_watched_threads = 30;
var watcher_poll_time = 30 * 1000;

var watched_threads;
load_watched_threads();

function load_watched_threads() {
	if (localStorage.getItem("watched_threads"))
		watched_threads = JSON.parse(localStorage.getItem("watched_threads"));
	else
		watched_threads = {};
}

function save_watched_threads() {
	localStorage.setItem("watched_threads", JSON.stringify(watched_threads));
}

function add_watch($post) {
	var postid = get_post_id($post);
	
	load_watched_threads();
	if (!watched_threads.hasOwnProperty(postid)) {
		if (Object.keys(watched_threads).length >= max_watched_threads) {
			alert("Maximum number of threads watched already!");
			return;
		}

		var $intro = $post.find('.intro:first');
		var thread_data = {};
		thread_data.subject = $intro.find('.subject').text();
		thread_data.opname = $intro.find('.name').text();
		thread_data.optrip = $intro.find('.trip').text();
		thread_data.seen_reply_count = null;
		thread_data.known_reply_count = null;
		thread_data.last_seen_time = null;
		thread_data.last_known_time = null;
		thread_data.post = $post.find('.body:first:not(.post-inline-container)').text();
		if (thread_data.post.length > 80) {
			thread_data.post = thread_data.post.slice(0,80)+'…';
		}
		
		watched_threads[postid] = thread_data;
		save_watched_threads();
		
		add_watch_buttons($("."+get_post_class(postid)));
		if ($(".watcherButton").length == 0) {
			init_watcher_menu();
		} else {
			populate_watcher_screen();
			run_watcher_refresher();
		}
	}

	alert("Thread watched");
}

function remove_watch(postid) {
	load_watched_threads();
	delete watched_threads[postid];
	save_watched_threads();
	
	add_watch_buttons($("."+get_post_class(postid)));
	if (Object.keys(watched_threads).length == 0) {
		init_watcher_menu();
	} else {
		populate_watcher_screen();
		run_watcher_refresher();
	}
	
	alert("Thread unwatched");
}

function add_watch_buttons($posts) {
	$posts.each(function() {
		var $post = $(this);
		
		$post.find('.postfooter').remove();
		var $footer = $("<div/>")
			.addClass('postfooter')
			.appendTo($post);
		var $watchlink = $("<a/>")
			.appendTo($footer)
			.attr('href', 'javascript:void(0);');
		
		var postid = get_post_id($post);
		if (watched_threads.hasOwnProperty(postid)) {
			$watchlink
				.text('Unwatch')
				.click(function() {
					remove_watch(postid);
				});
		} else {
			$watchlink
				.text('Watch')
				.click(function() {
					add_watch($post);
				});
		}
	});
}

var watcher_query = null;
function refresh_watched_threads(callback) {
	if (watcher_query)
		query.abort();
	
	watcher_query = $.ajax({
		url: siteroot+'watcher/threads',
		data: {ids: Object.keys(watched_threads)},
		dataType: "json",
		success: function(data) {
			if (data.error) {
				console.log("Watcher error: "+data.error)
				return;
			}
			load_watched_threads();
			var threads = data.threads;
			var changed = false;
			var alerts = 0;
			for (id in threads) {
				if (!watched_threads[id])
					continue;
				// Only decrease the seen_reply_count value if the latest post seen
				// locally was more than two minutes ago (The server may cache old values for
				// a short amount of time), or if the last reported reply time is more recent
				// than the last seen reply.
				if (watched_threads[id].seen_reply_count == null ||
				    (watched_threads[id].seen_reply_count > threads[id].reply_count &&
				     threads[id].reply_count != null &&
				     (watched_threads[id].last_seen_time + 2*60 < Math.round((new Date()).getTime()/1000) ||
				      watched_threads[id].last_seen_time < threads[id].last_reply_time))) {
					watched_threads[id].seen_reply_count = threads[id].reply_count;
					changed = true;
				}
				if (watched_threads[id].last_seen_time == null) {
					watched_threads[id].last_seen_time = threads[id].last_reply_time;
					changed = true;
				}
				if (watched_threads[id].known_reply_count != threads[id].reply_count) {
					watched_threads[id].known_reply_count = threads[id].reply_count;
					changed = true;
				}
				if (watched_threads[id].last_known_time != threads[id].last_reply_time) {
					watched_threads[id].last_known_time = threads[id].last_reply_time;
					changed = true;
				}
			}
			
			if (changed)
				save_watched_threads();
			populate_watcher_screen();

			if(callback)
				callback(true);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			if (textStatus == "abort")
				return;
			console.log("Error retrieving watched threads");
			if(callback)
				callback(false);
		},
		complete: function() {
			watcher_query = null;
		}
	});
}

function open_watcher() {
	var $watcherScreen = $('#watcherScreen');
	if ($watcherScreen.is(':hidden')) {
		$('.watcherButton').addClass('open');
		var $navbar = $('.boardlist.top');
		$watcherScreen
			.show()
			.css('position', $navbar.css('position') )
			.css('top', $navbar.height() );
	} else {
		$('.watcherButton').removeClass('open');
		$watcherScreen.hide();
	}
}

function populate_watcher_screen() {
	var $watcherScreen = $('#watcherScreen');
	$watcherScreen.html('');
	var alerts = 0;

	for (id in watched_threads) {
		var thread = watched_threads[id];
		
		var match = /^(\w+):(\d+)$/.exec(id);
		var board = match[1];
		var postnum = match[2];
		
		var $name = $('<span/>')
			.addClass('wname')
			.text(thread.opname);
		var $trip = $('<span/>')
			.addClass('wtrip')
			.text(thread.optrip);
		var $subject = $('<span/>')
			.addClass('wsubject')
			.text(thread.subject);
		var $post = $('<span/>')
			.addClass('wpost')
			.text(thread.post);

		var $postcounter;
		var unread_hash = '';
		if (thread.known_reply_count == null) {
			$postcounter = '';
		} else {
			$postcounter = $('<span/>')
				.addClass('wpostcounter');
			var $allposts = $('<span/>')
				.addClass('wallposts')
				.text(thread.known_reply_count+' posts');

			// If the reported last time is greater than
			// the last seen time, and we're not directly
			// viewing this thread now, then show the
			// number of new posts.
			if (thread.last_known_time > thread.last_seen_time && page_thread_id != id) {
				alerts++;
				unread_hash = '#unread';
				var $newposts = $('<span/>')
					.addClass('wnewposts');
				if (thread.known_reply_count > thread.seen_reply_count) {
					$newposts.text((thread.known_reply_count-thread.seen_reply_count)+' new');
				} else {
					$newposts.text('unknown new');
				}
				$postcounter.append('(', $allposts, '/', $newposts, ')');
			} else {
				$postcounter.append('(', $allposts, ')');
			}
		}
		
		var $postlink = $('<a/>')
			.addClass('wlink')
			.attr('href', make_thread_url(board, postnum)+unread_hash)
			.text('/'+board+'/'+postnum);
		var $postlinkpart = $('<span/>')
			.addClass('wlinkpart')
			.append($postlink);
		if (thread.known_reply_count > 100) {
			var $postlink50 = $('<a/>')
				.addClass('wlink50')
				.attr('href', make_thread50_url(board, postnum)+unread_hash)
				.text('+50');
			$postlinkpart.append(' ', $postlink50);
		}

		var $removebutton = $('<a/>')
			.addClass('wremove')
			.attr("href", "javascript:;")
			.text('X');
		(function() {
			// javascript scoping is fun
			var postid = id;
			$removebutton.click(function() {
				remove_watch(postid);
			});
		})();

		var $top = $('<div/>')
			.addClass('wtop')
			.append($postlinkpart, ' ', $name, $trip, ' ', $postcounter, ' ', $removebutton);
		var $details = $('<div/>')
			.addClass('wdetails')
			.append($subject, ' — ', $post);
		var $thread = $('<div/>')
			.addClass('wthread')
			.appendTo($watcherScreen)
			.append($top, $details);
	}
	watcher_alerts(alerts);
}

function watcher_alerts(count) {
	var $watcherAlerts = $('#watcherAlerts');
	if (count == 0) {
		$watcherAlerts.remove();
	} else {
		if ($watcherAlerts.length == 0) {
			$watcherAlerts = $('<span/>')
				.attr('id', 'watcherAlerts')
				.prependTo( $('.watcherButton') );
		}
		$watcherAlerts.text('('+count+')');
	}
}

var watcher_refresher_running = false;
var watcher_refresher_timer = null;
function run_watcher_refresher() {
	end_watcher_refresher();
	
	watcher_refresher_running = true;
	var multiplier = 1;
	
	function runner(success) {
		if (Object.keys(watched_threads).length == 0) {
			watcher_refresher_running = false;
			return;
		}
		
		if (success)
			multiplier = 1;
		else
			multiplier++;
		
		watcher_refresher_timer = setTimeout(refresh_watched_threads, watcher_poll_time * multiplier, runner);
	}
	refresh_watched_threads(runner);
}

function end_watcher_refresher() {
	if (watcher_refresher_running) {
		if (watcher_refresher_timer)
			clearTimeout(watcher_refresher_timer);
		watcher_refresher_timer = null;
		if (watcher_query)
			watcher_query.abort();
		watcher_refresher_running = false;
	}
}

function init_watcher_menu() {
	$(".watcherButton, #watcherScreen").remove();
	
	if (Object.keys(watched_threads).length == 0)
		return;
	
	var $watcherButton = $("<a/>")
		.addClass("watcherButton")
		.text("watcher")
		.attr("href", "javascript:;")
		.prependTo( $(".top .settingsSection") );

	var $watcherScreen = $("<div/>")
		.attr("id", "watcherScreen")
		.text('watcher screen is this')
		.appendTo(document.body)
		.hide();

	populate_watcher_screen();
	
	$watcherButton.click(open_watcher);

	run_watcher_refresher();
}

function watcher_acknowledge_page() {
	// Only acknowledge thread pages
	if($('div.banner').length == 0)
		return;
	var threadid = get_post_id($('.thread .post.op').first());
	if (!(threadid in watched_threads))
		return;
	var reply_count = $('.thread .reply:not(.post-inline)').length;
	$('.thread .omitted').each(function() {
		var text = $(this).text();
		var match = /^(\d+) posts/.exec(text);
		if (match)
			reply_count += parseInt(match[1]);
	});
	
	var last_seen_time = (new Date($('.thread .reply:not(.post-inline) time').last().attr('datetime'))).getTime()/1000;
	
	if (watched_threads[threadid].seen_reply_count != reply_count ||
	    watched_threads[threadid].last_seen_time != last_seen_time) {
		load_watched_threads();
		watched_threads[threadid].seen_reply_count = reply_count;
		watched_threads[threadid].last_seen_time = last_seen_time;
		save_watched_threads();
	}

	populate_watcher_screen();
}

function jump_to_first_unread_post() {
	if (!page_thread_id)
		return false;
	if (!(page_thread_id in watched_threads))
		return false;
	var last_seen_time = watched_threads[page_thread_id].last_seen_time;
	if (!last_seen_time)
		return false;
	var jumped = false;
	$('.thread .reply').each(function() {
		var $post = $(this);
		var post_time = (new Date($post.find('.intro:first').find('time:first').attr('datetime'))).getTime()/1000;
		if (post_time > last_seen_time) {
			jumped = true;
			var postnum = get_post_num($post);
			window.location.hash = postnum;
			highlightReply(postnum);
			return false;
		}
	});
	return jumped;
}

var page_thread_id = null;

$(document).ready(function() {
	if ($('div.banner').length && $('.thread .post.op').length)
		page_thread_id = get_post_id($('.thread .post.op').first());
	
	if ($('div.banner').length && window.location.hash == '#unread') {
		jump_to_first_unread_post();
	}
	
	watcher_acknowledge_page();
	init_watcher_menu();
	add_watch_buttons( $(".post.op") );

	var watcher_ack_pending = false;
	$(document).on('new_post', function(e, post) {
		var $post = $(post);
		if ($post.is(".op"))
			add_watch_buttons($post);
		
		if (!watcher_ack_pending) {
			watcher_ack_pending = true;
			setTimeout(function() {
				watcher_ack_pending = false;
				watcher_acknowledge_page();
			}, 50);
		}
	});
});
