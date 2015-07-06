<?php

/*
 *  Copyright (c) 2010-2013 Tinyboard Development Group
 *
 *  WARNING: This is a project-wide configuration file and is overwritten when upgrading to a newer
 *  version of Tinyboard. Please leave this file unchanged, or it will be a lot harder for you to upgrade.
 *  If you would like to make instance-specific changes to your own setup, please use instance-config.php.
 *
 *  This is the default configuration. You can copy values from here and use them in
 *  your instance-config.php
 *
 *  You can also create per-board configuration files. Once a board is created, locate its directory and
 *  create a new file named config.php (eg. b/config.php). Like instance-config.php, you can copy values
 *  from here and use them in your per-board configuration files.
 *
 *  Some directives are commented out. This is either because they are optional and examples, or because
 *  they are "optionally configurable", and given their default values by Tinyboard's code later if unset.
 *
 *  More information: http://tinyboard.org/docs/?p=Config
 *
 *  Tinyboard documentation: http://tinyboard.org/docs/
 *
 */


/*
 * =======================
 *  General/misc settings
 * =======================
 */
	// Blotter -- the simple version.
	//$config['blotter'] = 'This is an important announcement!';

	// Disable posting.
	$config['readonly_maintenance'] = false;
	// Message to show when in readonly mode.
	$config['readonly_maintenance_message'] = 'Posting temporarily disabled for very brief maintenance! Try again in a minute!';

	// Shows some extra information at the bottom of pages. Good for debugging development.
	$config['debug'] = false;
	// For development purposes. Turns 'display_errors' on. Not recommended for production.
	$config['verbose_errors'] = true;

	// Use fastcgi_finish_request() to close client connections as early
	// as necessary. Can improve performance, but may cause errors that
	// occur after the connection is closed to not be reported.
	$config['use_fastcgi_finish_request'] = false;

	// Directory where temporary files will be created. Not really used much yet except for some experimental stuff.
	$config['tmp'] = sys_get_temp_dir();

	// The HTTP status code to use when redirecting. http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
	// Can be either 303 "See Other" or 302 "Found". (303 is more correct but both should work.)
	$config['redirect_http'] = 303;

	// A small file in the main directory indicating that the script has been ran and the board(s) have been generated.
	// This keeps the script from querying the database and causing strain when not needed.
	$config['has_installed'] = '.installed';

	// Use syslog() for logging all error messages and unauthorized login attempts.
	$config['syslog'] = false;

	// Use `host` via shell_exec() to lookup hostnames, avoiding query timeouts. May not work on your system.
	// Requires safe_mode to be disabled.
	$config['dns_system'] = false;

	//$config['action_log'] = '/var/log/tinyboard/action.log';
	//$config['antibot_log'] = '/var/log/tinyboard/antibot.log';
	//$config['timing_log'] = '/var/log/tinyboard/timing.log';
	//$config['error_log'] = '/var/log/tinyboard/error.log';
	//$config['js_usage_log'] = '/var/log/tinyboard/js_usage.log';
	//$config['js_error_log'] = '/var/log/tinyboard/js_error.log';
	//$config['js_misc_log'] = '/var/log/tinyboard/js_misc.log';

/*
 * ====================
 *  Database settings
 * ====================
 */

	// SQL driver ("mysql", "pgsql", "sqlite", "dblib", etc)
	// http://www.php.net/manual/en/pdo.drivers.php
	$config['db']['type'] = 'mysql';
	// Hostname or IP address
	$config['db']['server'] = 'localhost';
	// Login
	$config['db']['user'] = '';
	$config['db']['password'] = '';
	// Tinyboard database
	$config['db']['database'] = '';
	// Use a persistent connection (experimental)
	$config['db']['persistent'] = false;
	// Anything more to add to the DSN string (eg. port=xxx;foo=bar)
	$config['db']['dsn'] = 'charset=UTF8';
	// Timeout duration in seconds (not all drivers support this)
	$config['db']['timeout'] = 5;

/*
 * ====================
 *  Cache settings
 * ====================
 */

	$config['cache']['enabled'] = false;
	// $config['cache']['enabled'] = 'memcached';
	// $config['cache']['enabled'] = 'redis';
	// $config['cache']['enabled'] = 'apc';
	// $config['cache']['enabled'] = 'xcache';

	// Timeout for cached objects such as posts and HTML
	$config['cache']['timeout'] = 43200; // 12 hours

	// Optional prefix if you're running multiple Tinyboard instances on the same machine
	$config['cache']['prefix'] = '';

	// Memcached servers to use - http://www.php.net/manual/en/memcached.addservers.php
	$config['cache']['memcached'] = array(
		array('localhost', 11211)
	);

	// Redis server to use. Location, port, password, database id.
	// Note that Tinyboard may clear the database at times, so you may want to pick a
	// database id just for Tinyboard to use.
	$config['cache']['redis'] = array('localhost', 6379, '', 1);

/*
 * ====================
 *  Cookie settings
 * ====================
 */

	// Used for moderation login
	$config['cookies']['mod'] = 'mod';
	// Used for communicating with Javascript; telling it when posts were successful.
	// Rebuild Javascript file after changing this value or it won't work.
	$config['cookies']['js'] = 'serv';
	// Cookies "path". Defaults to $config['root']. If $config['root'] is a URL, you need to set this. Should be '/' or '/board/', depending on your installation.
	// $config['cookies']['path'] = '/';
	// Where to set the 'path' parameter to $config['cookies']['path'] when creating cookies. Recommended.
	$config['cookies']['jail'] = true;
	// How long should the cookies last (in seconds)
	$config['cookies']['expire'] = 15778463; //6 months
	// Make this something long and random for security
	$config['cookies']['salt'] = 'abcdefghijklmnopqrstuvwxyz09123456789!@#$%^&*()';
	// How long should moderators should remain logged in (0=browser session) (in seconds)
	$config['mod']['expire'] = 15778463; //6 months
	// Used to salt secure tripcodes (##trip) and poster IDs (if enabled)
	$config['secure_trip_salt'] = ')(*&^%$#@!98765432190zyxwvutsrqponmlkjihgfedcba';
	// Controls how much processing power is used in generating secure tripcodes
	$config['secure_count_log2'] = 7;
	// Use KusabaX secure tripcode algorithm
	$config['kusabax_secure_tripcode'] = false;
	$config['KU_RANDOMSEED'] = 'x';

	// Used for simple access-control
	$config['cookies']['mod_secret'] = 'lmnopqrstuvwxyz09123456789!@#$%^&*()';

/*
 * ====================
 *  Flood/spam settings
 * ====================
 */

	// How many seconds between each post
	$config['flood_time'] = 10;
	// How many seconds between each post with exactly the same content and same IP
	$config['flood_time_ip'] = 120;
	// Same as above but different IP address
	$config['flood_time_same'] = 30;

	// DNS blacklists (DNSBL) http://tinyboard.org/docs/?p=Config/DNSBL

	// http://www.sectoor.de/tor.php
	$config['dnsbl'][] = array('tor.dnsbl.sectoor.de', 1); // Tor exit servers

	// http://www.sorbs.net/using.shtml
	// $config['dnsbl'][] = array('dnsbl.sorbs.net', array(2, 3, 4, 5, 6, 7, 8, 9));

	// http://www.projecthoneypot.org/httpbl.php
	// $config['dnsbl'][] = array('<your access key>.%.dnsbl.httpbl.org', function($ip) {
	//	$octets = explode('.', $ip);
	//
	//	// days since last activity
	//	if ($octets[1] > 14)
	//		return false;
	//
	//	// "threat score" (http://www.projecthoneypot.org/threat_info.php)
	//	if ($octets[2] < 5)
	//		return false;
	//
	//	return true;
	// }, 'dnsbl.httpbl.org'); // hide our access key


	// Skip checking certain IP addresses against blacklists (for troubleshooting or whatever)
	$config['dnsbl_exceptions'][] = '127.0.0.1';

	/*
	 * Introduction to Tinyboard's spam filter:
	 *
	 * In simple terms, whenever a posting form on a page is generated (which happens whenever a
	 * post is made), Tinyboard will add a random amount of hidden, obscure fields to it to
	 * confuse bots and upset hackers. These fields and their respective obscure values are
	 * validated upon posting with a 160-bit "hash".
	 */

	// Number of hidden fields to generate
	$config['spam']['hidden_inputs_min'] = 4;
	$config['spam']['hidden_inputs_max'] = 12;
	// These are fields used to confuse the bots. Make sure they aren't actually used by Tinyboard, or it won't work.
	$config['spam']['hidden_input_names'] = array(
		'user',
		'username',
		'login',
		'search',
		'q',
		'url',
		'firstname',
		'lastname',
		'text',
		'message'
	);
	// Always update this when adding new valid fields to the post form, or EVERYTHING WILL BE DETECTED AS SPAM!
	$config['spam']['valid_inputs'] = array(
		'hash',
		'board',
		'thread',
		'mod',
		'name',
		'email',
		'subject',
		'post',
		'body',
		'password',
		'sticky',
		'lock',
		'raw',
		'use_capcode',
		'embed',
		'recaptcha_challenge_field',
		'recaptcha_response_field',
		'spoiler',
		'spoiler_thread',
		'mature',
		'file',
		'thumbfile',
		'thumbdurl',
		'thumbtime',
		'wantjson',
		'making_a_post',
		'activate_egg',
		'quick-reply'
	);

	// Custom flood filters. Detect flood attacks and reject new posts if there's a positive match.
	// See http://tinyboard.org/wiki/index.php?title=Flood_filters for more information.
	//$config['flood_filters'][] = array(
	//	'condition' => array(
	//		// 100 posts in the past 5 minutes (~20 p/m)
	//		'posts_in_past_x_minutes' => array(100, 5)
	//	),
	//	// Don't allow the user to post
	//	'action' => 'reject',
	//	// Display this message
	//	'message' => 'Your post has been rejected on the suspicion of a flood attack on this board.'
	//);

	// Another filter
	//$config['flood_filters'][] = array(
	//	'condition' => array(
	//		// 10 new empty threads in the past 2 minutes
	//		'threads_with_no_replies_in_past_x_minutes' => array(10, 2),
	//		// Allow replies, but not new threads (ie. reject topics only).
	//		'OP' => true
	//	),
	//	'action' => 'reject',
	//	'message' => 'Your post has been rejected on the suspicion of a flood attack on this board (too many new threads); post a reply instead.'
	//);

	// Enable reCaptcha to make spam even harder
	$config['recaptcha'] = false;
	// Public and private key pair from https://www.google.com/recaptcha/admin/create
	$config['recaptcha_public'] = '6LcXTcUSAAAAAKBxyFWIt2SO8jwx4W7wcSMRoN3f';
	$config['recaptcha_private'] = '6LcXTcUSAAAAAOGVbVdhmEM1_SyRF4xTKe8jbzf_';

/*
 * ====================
 *  Post settings
 * ====================
 */

	// Do you need a body for your reply posts?
	$config['force_body'] = false;
	// Do you need a body for new threads?
	$config['force_body_op'] = true;
	// Strip superfluous new lines at the end of a post
	$config['strip_superfluous_returns'] = true;
	// Require an image for threads?
	$config['force_image_op'] = true;

	// Max body length
	$config['max_body'] = 1800;
	// Amount of post lines to show on the index page
	$config['body_truncate'] = 15;
	// Amount of characters to show on the index page
	$config['body_truncate_char'] = 2500;

	// Typically spambots try to post a lot of links. Refuse a post with X standalone links?
	$config['max_links'] = 20;
	// Maximum number of cites per post (protects against abuse)
	$config['max_cites'] = 45;
	// Maximum number of cross-board links/cites per post
	$config['max_cross'] = $config['max_cites'];

	// Track post citations (>>XX). Rebuilds posts after a cited post is deleted, removing broken links.
	// A little more database load.
	$config['track_cites'] = true;

	// Maximum filename length (will be truncated)
	$config['max_filename_len'] = 255;
	// Maximum filename length to display (the rest can be viewed upon mouseover)
	$config['max_filename_display'] = 30;

	// How long before you can delete a post after posting, in seconds.
	$config['delete_time'] = 10;
	// How long you are allowed to edit a post after posting, in seconds.
	// 0 means no limit.
	$config['edit_time_end'] = 2*60*60;

	// Disable replies bumping stickied threads
	$config['no_sticky_reply_bump'] = true;

	// Reply limit (stops bumping thread when this is reached)
	$config['reply_limit'] = 250;

	// Cyclic thread reply limit (old replies are removed as this is hit)
	$config['cyclic_reply_limit'] = 500;

	// A random number between these two values will be calculated for every
	// thread, and recalculated when the thread is bumped.
	// If a thread past its bump reply_limit hasn't been bumped for this amount
	// of time and it gets a reply, then it will be bumped anyway.
	// Units are seconds. Setting either to 0 disables old thread bumping.
	$config['old_thread_bump_interval_min'] = 9*60*60;
	// See above
	$config['old_thread_bump_interval_max'] = 14*60*60;

	// Image hard limit (stops allowing new image replies when this is reached if not zero)
	$config['image_hard_limit'] = 1000;
	// Reply hard limit (stops allowing new replies when this is reached if not zero)
	$config['reply_hard_limit'] = 1500;

	// Automatically convert things like "..." to Unicode characters ("…")
	$config['auto_unicode'] = true;
	// Whether to turn URLs into functional links
	$config['markup_urls'] = true;

	// Wordfilters are used to automatically replace certain words/phrases with something else.
	// For a normal string replacement:
	// $config['wordfilters'][] = array('cat', 'dog');

	// Advanced raplcement (regular expressions):
	// $config['wordfilters'][] = array('/cat/', 'dog', true); // 'true' means it's a regular expression

	// Allow users to edit their own posts
	$config['allow_self_edit'] = false;

	// Allow [#Mature] threads
	$config['mature_allowed'] = false;

	// Show spoiler thread button
	$config['show_spoiler_thread_button'] = false;

	// Show image spoiler button if thread spoiler button is shown?
	$config['show_image_spoiler_when_thread_spoiler_available'] = false;

	// Always act as if they had typed "noko" in the email field no mattter what
	$config['always_noko'] = false;

	// Don't show email field when set to noko
	$config['hide_noko'] = true;
	// Don't show email field when set to sage
	$config['hide_sage'] = false;

	// Custom tripcodes. The below example makes a tripcode
	//  of "#test123" evaluate to "!HelloWorld"
	// $config['custom_tripcode']['#test123'] = '!HelloWorld';
	// $config['custom_tripcode']['##securetrip'] = '!!somethingelse';

	// Optional spoiler images
	$config['spoiler_images'] = false;


	// With the following, you can disable certain superfluous fields or enable "forced anonymous".

	// When true, all names will be set to $config['anonymous'].
	$config['field_disable_name'] = false;
	// When true, no email will be able to be set.
	$config['field_disable_email'] = false;
	// When true, no subject will be able to be set.
	$config['field_disable_subject'] = false;
	// When true, no subject will be able to be set in replies.
	$config['field_disable_reply_subject'] = false;
	// When true, a blank password will be used for files (not usable for deletion).
	$config['field_disable_password'] = false;

	// Require users to see the ban page at least once for a ban even if it has since expired?
	$config['require_ban_view'] = true;

/*
 * ====================
 *  Markup settings
 * ====================
 */

	$config['markup'][] = array("/\[b\](.+?)\[\/b\]/s", "<strong>\$1</strong>");
	$config['markup'][] = array("/\[i\](.+?)\[\/i\]/s", "<em>\$1</em>");
	$config['markup'][] = array("/\[u\](.+?)\[\/u\]/s", "<u>\$1</u>");
	$config['markup'][] = array("/\[s\](.+?)\[\/s\]/s", "<s>\$1</s>");
	$config['markup'][] = array("/\[spoiler\](.+?)\[\/spoiler\]/s", "<span class=\"spoiler\">\$1</span>");
	$config['markup'][] = array("/\[\?\](.+?)\[\/\?\]/s", "<span class=\"spoiler\">\$1</span>");
	$config['markup'][] = array("/\[h\](?:\s*\n)?(.+?)\[\/h\]/s", "<div class=\"hidetext\">\$1</div>");
	$config['markup'][] = array('/\[hide\](?:\s*\n)?(.+?)\[\/hide\]/s', "<div class=\"hidetext\">\$1</div>");
	$config['markup'][] = array("/\[#(.+?)\]/", "<span class=\"hashtag\">#\$1</span>");
	$config['markup'][] = array("/^\s*==(.+?)==\s*$/m", "<span class=\"heading\">\$1</span>");
	$config['markup'][] = array("/\[cs\](.+?)\[\/cs\]/s", "<span class=\"comicsans\">\$1</span>");
	$config['markup'][] = array("/\[shy\](.+?)\[\/shy\]/s", "<span class=\"shy\">\$1</span>");
	$config['markup'][] = array("/\[tt\](.+?)\[\/tt\]/s", "<span style=\"font-family: monospace\">\$1</span>");
	$config['markup'][] = array("/\[rcv\](.+?)\[\/rcv\]/s", function($matches) {
		$rpl = $matches[1];
		// avoid replacing stuff inside html tags
		$rpl = preg_replace_callback('/(?<=^|>)([^<]+)/', function($matches) {
			return preg_replace_callback('/(?<=^|;)([^&]+)/', function($matches) {
				$part = strtoupper($matches[1]);
				$part = preg_replace("/\bI\b/", "WE", $part);
				$part = preg_replace("/\bME\b/", "US", $part);
				$part = preg_replace("/\bYOU\b/", "THOU", $part);
				$part = preg_replace("/\bMY\b/", "OUR", $part);
				$part = preg_replace("/\bMINE\b/", "OURS", $part);
				$part = preg_replace("/\bYOUR\b/", "THINE", $part);
				$part = preg_replace("/\bWILL\b/", "SHALL", $part);
				$part = preg_replace("/\bSHOULD\b/", "SHOULDST", $part);
				$part = preg_replace("/\bAM\b/", "ART", $part);
				return $part;
			}, $matches[1]);
		}, $rpl);
		return "<span class=\"royalluna\">$rpl</span>";
	});
	$config['markup'][] = array(
		'/\[(?<count>\d+)?d(?<sides>\d+)(?<modifier>[+-]\d+)?\]/',
		function($match) {
			if ($match['count'] === "")
				$match['count'] = 1;
			$count = min(intval($match['count']), 1000);
			$sides = intval($match['sides']);

			$result = 0;
			for ($i = 0; $i < $count; $i++) {
				$result += rand(1, $sides);
			}

			$modnote = '';
			if (isset($match['modifier'])) {
				$modifier = intval($match['modifier']);
				$modnote = ' '.($modifier<0 ? '-' : '+').' '.abs($modifier);
				$result += $modifier;
			}

			return '<span class="diceroll">Roll '.$count.'d'.$sides.$modnote.' = '.$result.'</span>';
		}
	);

	$config['user_url_markup'] = true;

	// Highlight PHP code wrapped in <code> tags (PHP 5.3.0+)
	// $config['markup'][] = array(
	// 	'/^&lt;code&gt;(.+)&lt;\/code&gt;/ms',
	// 	function($matches) {
	// 		return highlight_string(html_entity_decode($matches[1]), true);
	// 	}
	// );

/*
 * ====================
 *  Image settings
 * ====================
 */

	// For resizing, max thumbnail size
	$config['thumb_width'] = 125;
	$config['thumb_height'] = 125;
	// Max thumbnail size for thread images
	$config['thumb_op_width'] = 250;
	$config['thumb_op_height'] = 250;

	// Thumbnail extension, empty for inherited (png recommended)
	$config['thumb_ext'] = '';

	$config['video_thumb_ext'] = 'jpg';

	// Maximum amount of frames to resize (more frames means more processing power). "1" means no animated thumbnails.
	// Requires $config['thumb_ext'] to be 'gif' and $config['thumb_method'] to be 'imagick', 'convert', or 'convert+gifsicle'.
	// Not respected by 'convert'; will just resize all frames if this is > 1.
	$config['thumb_keep_animation_frames'] = 1;

	// Thumbnailing method:
	//	- 'gd'			PHP GD (default). Only handles the most basic image formats (GIF, JPEG, PNG).
	//				This is a prerequisite for Tinyboard no matter what method you choose.
	//	- 'imagick'		PHP's ImageMagick bindings. Fast and efficient, supporting many image formats.
	//				A few minor bugs. http://pecl.php.net/package/imagick
	//	- 'convert'		The command line version of ImageMagick (`convert`). Fixes most of the bugs in
	//				PHP Imagick.
	//	- 'convert+gifsicle'	Same as above, with the exception of using `gifsicle` (command line application)
	//				instead of `convert` for resizing gifs. It's faster and resulting animated gifs
	//				have less artifacts than if resized with ImageMagick.
	$config['thumb_method'] = 'gd';

	// Strip EXIF metadata from JPEG files
	$config['strip_exif'] = false;

	// Allowed file mime types and their default extensions
	$config['allowed_image_types']['image/jpeg'] = 'jpg';
	$config['allowed_image_types']['image/bmp'] = 'bmp'; // TODO auto-convert these to png
	$config['allowed_image_types']['image/gif'] = 'gif';
	$config['allowed_image_types']['image/png'] = 'png';

	$config['allowed_video_types']['video/webm'] = 'webm';

	// Allowed additional file extensions (not images; downloadable files)
	// $config['allowed_ext_files'][] = 'txt';
	// $config['allowed_ext_files'][] = 'zip';

	// An alternative function for generating a filename, instead of the default UNIX timestamp.
	// http://tinyboard.org/wiki/index.php?title=Filenames
	// $config['filename_func'] = 'some_function_you_have_created';

	// Non-image file icons
	$config['file_icons']['default'] = 'file.png';
	$config['file_icons']['zip'] = 'zip.png';

	// Thumbnail to use for the downloadable files (not images)
	$config['file_thumb'] = 'static/%s';
	// Thumbnail to use for spoiler images
	$config['spoiler_image'] = 'static/spoiler.png';

	// Thumbnail quality (compression level), from 0 to 9
	$config['thumb_quality'] = 8;

	// When a thumbnailed image is going to be the same (in dimension), just copy the entire file and use that as a thumbnail instead of resizing/redrawing
	$config['minimum_copy_resize'] = false;

	// Store image hash in the database for r9k-like boards implementation soon
	// Function name for hashing
	// sha1_file, md5_file, etc. You can also define your own similar function.
	$config['file_hash'] = 'sha1_file';

	// Maximum image upload size in bytes
	$config['max_filesize'] = 10*1024*1024; // 10MB
	// Maximum video upload size in bytes
	$config['max_video_filesize'] = 3*1024*1024; // 3MB
	// Maximum thumbnail upload size in bytes
	$config['max_thumb_filesize'] = 256*1024; // 256KB
	// Maximum image dimensions
	$config['max_width'] = 10000;
	$config['max_height'] = $config['max_width']; // 1:1
	// Reject duplicate image uploads
	$config['image_reject_repost'] = false;
	// Reject duplicate image uploads within the same thread. Doesn't change anything if image_reject_repost is true.
	$config['image_reject_repost_in_thread'] = false;

	// Display the aspect ratio in a post's file info
	$config['show_ratio'] = false;
	// Display the file's original filename
	$config['show_filename']= true;

	// Redraw the image using GD functions to strip any excess data (commonly ZIP archives)
	// WARNING: Currently strips animated GIFs too
	$config['redraw_image'] = false;

	// Number of posts in a "View Last X Posts" page
	$config['noko50_count'] = 50;
	// Number of posts a thread needs before it gets a "View Last X Posts" page
	$config['noko50_min'] = 100;
/*
 * ====================
 *  Board settings
 * ====================
 */

	// Maximum amount of threads to display on a given page.
	$config['threads_per_page'] = 10;
	// Maximum number of pages. Content past the last page is automatically purged.
	$config['max_pages'] = 10;
	// Replies to show per thread on the board index page.
	$config['threads_preview'] = 3;
	// Same as above, but for stickied threads.
	$config['threads_preview_sticky'] = 1;

	// Name of the boards. Usually '/%s/' (/b/, /mu/, etc)
	// $config['board_abbreviation'] - BOARD_TITLE
	$config['board_abbreviation'] = '/%s/';

	// The default name (ie. Anonymous)
	$config['anonymous'] = 'Anonymous';

	// How many reports you can create in the same request.
	$config['report_limit'] = 30;

/*
 * ====================
 *  Display settings
 * ====================
 */

	// Locale (en, ru_RU.UTF-8, fi_FI.UTF-8, pl_PL.UTF-8)
	$config['locale'] = 'en';

	// Timezone
	$config['timezone'] = 'America/Los_Angeles';

	// The format string passed to strftime() for post times
	// http://www.php.net/manual/en/function.strftime.php
	$config['post_date'] = '%d %b %Y %H:%M:%S %Z';

	// Same as above, but used for "you are banned' pages.
	$config['ban_date'] = '%A %e %B, %Y';

	// The names on the post buttons. (On most imageboards, these are both "Post")
	$config['button_newtopic'] = 'New Topic';
	$config['button_reply'] = 'New Reply';

	// Assign each poster in a thread a unique ID, shown by "ID: {id}" before the post number.
	$config['poster_ids'] = false;
	// Number of characters in the poster ID (maximum is 40)
	$config['poster_id_length'] = 6;

	// Show thread subject in page title?
	$config['thread_subject_in_title'] = true;

	// Page footer
	$config['footer'][] = 'All trademarks, copyrights, comments, and images on this page are owned by and are the responsibility of their respective parties.';

	// Characters used to generate a random password (with Javascript)
	$config['genpassword_chars'] = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';

	// Page image banners
	$config['banner_prefix'] = 'static/banners/';
	// Array is (filename, width, height)
	// $config['banners'][] = array('some%20image.png', 600, 150);
	$config['banners'][] = array('agiri-panic.png', 400, 100);
	$config['banners'][] = array('batman.gif', 400, 100);
	//$config['banners'][] = array('colshy-cmc.jpg', 400, 100);
	$config['banners'][] = array('colshy-copypasta.jpg', 333, 100);
	$config['banners'][] = array('colshy-fs.jpg', 400, 100);
	$config['banners'][] = array('colshy-groovy.jpg', 400, 100);
	$config['banners'][] = array('colshy-humanchan.jpg', 400, 100);
	$config['banners'][] = array('colshy-khan.jpg', 400, 100);
	$config['banners'][] = array('colshy-no.jpg', 400, 100);
	$config['banners'][] = array('colshy-the%20ride.jpg', 400, 100);
	$config['banners'][] = array('cpu-wrestler.jpg', 400, 100);
	$config['banners'][] = array('eleanoré-scootachan.png', 400, 100);
	$config['banners'][] = array('evamena-rvb.jpg', 400, 100);
	$config['banners'][] = array('fen-sweetie.jpg', 400, 100);
	$config['banners'][] = array('forever.jpg', 400, 100);
	$config['banners'][] = array('knight-derpy.jpg', 400, 100);
	$config['banners'][] = array('knight-logo.jpg', 400, 100);
	$config['banners'][] = array('knight-mario.gif', 400, 100);
	$config['banners'][] = array('knight-terminal.gif', 400, 100);
	$config['banners'][] = array('mikie-eckg.jpg', 400, 100);
	$config['banners'][] = array('mudpony.png', 400, 100);
	$config['banners'][] = array('pwnies-obey.png', 400, 100);
	$config['banners'][] = array('salute.png', 400, 100);
	$config['banners'][] = array('sersys-changeling.gif', 400, 100);
	$config['banners'][] = array('sersys-lines.png', 400, 100);
	$config['banners'][] = array('sersys-maud.jpg', 400, 100);
	$config['banners'][] = array('sersys-menu.gif', 400, 100);
	$config['banners'][] = array('sersys-no%20control.gif', 400, 100);
	$config['banners'][] = array('sersys-ponies.jpg', 400, 100);
	$config['banners'][] = array('sersys-sombra.jpg', 400, 100);
	$config['banners'][] = array('starmane-derails.png', 400, 100);
	$config['banners'][] = array('tiananmen.jpg', 400, 100);
	$config['banners'][] = array('wizard-crazy.jpg', 400, 100);
	$config['banners'][] = array('z-banner.gif', 400, 100);
	$config['banners'][] = array('z-taco%20tuesday.jpg', 400, 100);

	// Custom stylesheets available. The prefix for each stylesheet URI is defined below.

	// Values are array(displayName, file)
	// Yeah, the name and displayName match for most right now. This lets us change
	// the displayNames in the future without overriding people's settings.
	$config['stylesheets']['Colgate'] = array('Colgate', 'colgate.css');

	$config['stylesheets']['Twilight'] = array('Twilight', 'twilight.css');
	$config['stylesheets']['Twilight Tackle'] = array('Twilight Tackle', 'twilight-tackle.css');
	$config['stylesheets']['Rainbow Dash'] = array('Rainbow Dash', 'rainbow-dash.css');
	$config['stylesheets']['Fluttershy'] = array('Fluttershy', 'fluttershy.css');
	$config['stylesheets']['Applejack'] = array('Applejack', 'applejack.css');
	$config['stylesheets']['Rarity'] = array('Rarity', 'rarity.css');
	$config['stylesheets']['Nightmare Moon'] = array('Nightmare Moon', 'nightmare-moon.css');
	$config['stylesheets']['Vinyl Trance'] = array('Vinyl Trance', 'vinyl.css');
	$config['stylesheets']['Timelord'] = array('Timelord', 'timelord.css');
	$config['stylesheets']['Octavia'] = array('Octavia', 'octavia.css');
	$config['stylesheets']['Trixie'] = array('Trixie', 'trixie.css');
	$config['stylesheets']['Aloe and Lotus'] = array('Aloe and Lotus', 'aloe-and-lotus.css');
	$config['stylesheets']['Scootaloo'] = array('Scootaloo', 'scootaloo.css');
	$config['stylesheets']['Royal Guard'] = array('Royal Guard', 'royal-guard.css');
	$config['stylesheets']['Gilda'] = array('Gilda', 'gilda.css');

	$config['stylesheets']['Cloudsdale'] = array('Cloudsdale', 'Cloudsdale.css');
	$config['stylesheets']['Pone'] = array('Pone', 'pone.css');
	$config['stylesheets']['Yotsuba B'] = array('Yotsuba B', ''); // default
	$config['stylesheets']['Yotsuba'] = array('Yotsuba', 'yotsuba.css');
	// $config['stylesheets']['Futaba'] = array('Futaba', 'futaba.css');

	$config['stylesheets']['Luna (S1)'] = array('Luna (S1)', 'season-one-luna.css');
	$config['stylesheets']['Luna'] = array('Luna (S2)', 'luna.css');
	$config['stylesheets']['Wonderbolts'] = array('Wonderbolts', 'wonderbolts.css');
	$config['stylesheets']['Shadowbolts'] = array('Shadowbolts', 'shadowbolts.css');
	$config['stylesheets']['Nightmare'] = array('Halloween', 'nightmare.css');
	$config['stylesheets']['Australian'] = array('Australian', 'Australian.css');
	$config['stylesheets']['Chrysalis'] = array('Chrysalis', 'Queen.css');
	$config['stylesheets']['Tomorrow'] = array('Tomorrow', 'Tomorrow.css');
	$config['stylesheets']['Derpy'] = array('Derpy', 'derpy.css');
	$config['stylesheets']['Pinkie'] = array('Pinkie', 'pinkie.css');

	$config['stylesheets']['Geocities'] = array('Geocities', 'geocities.css');

	// The prefix for each stylesheet URI. Defaults to $config['root']/stylesheets/
	// $config['uri_stylesheets'] = 'http://static.example.org/stylesheets/';

	// The default stylesheet to use
	$config['default_stylesheet'] = 'Colgate';

	// Boardlinks
	// You can group, order and place the boardlist at the top of every page, using the following template.
	$config['boards'] = array(
	//	array('a', 'b'),
	//	array('c', 'd', 'e', 'f', 'g'),
	//	array('h', 'i', 'j'),
	//	array('k', array('l', 'm')),
	//	array('status' => 'http://status.example.org/')
	);

	$config['modboards'] = array(
	//	'mod', 'test'
	);

	// Categories
	// Required for the Categories theme.
	$config['categories'] = array(
	//	'Group Name' => array('a', 'b', 'c'),
	//	'Another Group' => array('d')
	);

	// Custom_categories
	// Optional for the Categories theme. array of name => (title, url) groups for categories with non-board links.
	//$config['custom_categories'] = array(
	//	'Links' => array(
	//		'Tinyboard' => 'http://tinyboard.org',
	//		'Donate' => 'donate.html'
	//	)
	//);

	// Automatically remove unnecessary whitespace when compiling HTML files from templates.
	$config['minify_html'] = true;

/*
 * ====================
 *  Video embedding
 * ====================
 */

	// Enable embedding (see below)
	$config['enable_embedding'] = false;

	// Custom embedding (YouTube, vimeo, etc.)
	// It's very important that you match the full string (with ^ and $) or things will not work correctly.
	$config['embedding'] = array(
		array(
			'/^https?:\/\/(\w+\.)?youtube\.com\/watch\?v=([a-zA-Z0-9\-_]{10,11})(&.+)?$/i',
			'<iframe style="float: left;margin: 10px 20px;" width="%%tb_width%%" height="%%tb_height%%" frameborder="0" id="ytplayer" type="text/html" src="http://www.youtube.com/embed/$2"></iframe>'
		),
		array(
			'/^https?:\/\/(\w+\.)?vimeo\.com\/(\d{2,10})(\?.+)?$/i',
			'<object style="float: left;margin: 10px 20px;" width="%%tb_width%%" height="%%tb_height%%"><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="http://vimeo.com/moogaloop.swf?clip_id=$2&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00adef&amp;fullscreen=1&amp;autoplay=0&amp;loop=0" /><embed src="http://vimeo.com/moogaloop.swf?clip_id=$2&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00adef&amp;fullscreen=1&amp;autoplay=0&amp;loop=0" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="%%tb_width%%" height="%%tb_height%%"></embed></object>'
		),
		array(
			'/^https?:\/\/(\w+\.)?dailymotion\.com\/video\/([a-zA-Z0-9]{2,10})(_.+)?$/i',
			'<object style="float: left;margin: 10px 20px;" width="%%tb_width%%" height="%%tb_height%%"><param name="movie" value="http://www.dailymotion.com/swf/video/$2"></param><param name="allowFullScreen" value="true"></param><param name="allowScriptAccess" value="always"></param><param name="wmode" value="transparent"></param><embed type="application/x-shockwave-flash" src="http://www.dailymotion.com/swf/video/$2" width="%%tb_width%%" height="%%tb_height%%" wmode="transparent" allowfullscreen="true" allowscriptaccess="always"></embed></object>'
		),
		array(
			'/^https?:\/\/(\w+\.)?metacafe\.com\/watch\/(\d+)\/([a-zA-Z0-9_\-.]+)\/(\?.+)?$/i',
			'<div style="float:left;margin:10px 20px;width:%%tb_width%%px;height:%%tb_height%%px"><embed flashVars="playerVars=showStats=no|autoPlay=no" src="http://www.metacafe.com/fplayer/$2/$3.swf" width="%%tb_width%%" height="%%tb_height%%" wmode="transparent" allowFullScreen="true" allowScriptAccess="always" name="Metacafe_$2" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash"></embed></div>'
		),
		array(
			'/^https?:\/\/video\.google\.com\/videoplay\?docid=(\d+)([&#](.+)?)?$/i',
			'<embed src="http://video.google.com/googleplayer.swf?docid=$1&hl=en&fs=true" style="width:%%tb_width%%px;height:%%tb_height%%px;float:left;margin:10px 20px" allowFullScreen="true" allowScriptAccess="always" type="application/x-shockwave-flash"></embed>'
		)
	);

	// Embedding width and height
	$config['embed_width'] = 300;
	$config['embed_height'] = 246;

/*
 * ====================
 *  Error messages
 * ====================
 */

	// Error messages
	$config['error']['lurk']		= _('Lurk some more before posting.');
	$config['error']['bot']			= _('You look like a bot.');
	$config['error']['referer']		= _('Your browser sent an invalid or no HTTP referer.');
	$config['error']['toolong']		= _('The %s field was too long.');
	$config['error']['toolong_body']	= _('The body was too long.');
	$config['error']['tooshort_body']	= _('The body was too short or empty.');
	$config['error']['noimage']		= _('You must upload an image.');
	$config['error']['nomove']		= _('The server failed to handle your upload.');
	$config['error']['noboard']		= _('Invalid board!');
	$config['error']['nonexistant']		= _('Thread specified does not exist.');
	$config['error']['locked']		= _('Thread locked. You may not reply at this time.');
	$config['error']['reply_hard_limit']	= _('Thread has reached its maximum reply limit.');
	$config['error']['image_hard_limit']	= _('Thread has reached its maximum image limit.');
	$config['error']['nopost']		= _('You didn\'t make a post.');
	$config['error']['flood']		= _('Flood detected; Post discarded.');
	$config['error']['spam']		= _('Your request looks automated; Post discarded.');
	$config['error']['dnsbl']		= _('Your IP address is listed in %s.');
	$config['error']['toomanylinks']	= _('Too many links; flood detected.');
	$config['error']['toomanycites']	= _('Too many cites; post discarded.');
	$config['error']['toomanycross']	= _('Too many cross-board links; post discarded.');
	$config['error']['nodelete']		= _('You didn\'t select anything to delete.');
	$config['error']['noreport']		= _('You didn\'t select anything to report.');
	$config['error']['noedit']		= _('You didn\'t select anything to edit.');
	$config['error']['toomanyreports']	= _('You can\'t report that many posts at once.');
	$config['error']['toomanyedits']	= _('You can only edit one post at once.');
	$config['error']['invalidpassword']	= _('Wrong password…');
	$config['error']['invalid_file']		= _('Invalid file.');
	$config['error']['noisy_video']		= _('Only silent video files are allowed.');
	$config['error']['unsupported_type']		= _('Unsupported file type.');
	$config['error']['filesize']		= _('Maximum file size: %maxsz% bytes<br>Your file\'s size: %filesz% bytes');
	$config['error']['maxsize']		= _('The file was too big.');
	$config['error']['invalidzip']		= _('Invalid archive!');
	$config['error']['fileexists']		= _('That file <a href="%s">already exists</a>!');
	$config['error']['fileexistsinthread']	= _('That file <a href="%s">already exists</a> in this thread!');
	$config['error']['delete_too_soon']	= _('You\'ll have to wait another %s before deleting that.');
	$config['error']['edit_too_late']	= _('Posts on this board may only be edited for %s after being made.');
	$config['error']['invalid_embed']	= _('Couldn\'t make sense of the URL of the video you tried to embed.');
	$config['error']['captcha']		= _('You seem to have mistyped the verification.');

	// Moderator errors
	$config['error']['invalid']		= _('Invalid username and/or password.');
	$config['error']['notamod']		= _('You are not a mod…');
	$config['error']['invalidafter']	= _('Invalid username and/or password. Your user may have been deleted or changed.');
	$config['error']['malformed']		= _('Invalid/malformed cookies.');
	$config['error']['missedafield']	= _('Your browser didn\'t submit an input when it should have.');
	$config['error']['required']		= _('The %s field is required.');
	$config['error']['invalidfield']	= _('The %s field was invalid.');
	$config['error']['boardexists']		= _('There is already a %s board.');
	$config['error']['noaccess']		= _('You don\'t have permission to do that.');
	$config['error']['invalidpost']		= _('That post doesn\'t exist…');
	$config['error']['404']			= _('Page not found.');
	$config['error']['modexists']		= _('That mod <a href="?/users/%d">already exists</a>!');
	$config['error']['invalidtheme']	= _('That theme doesn\'t exist!');
	$config['error']['csrf']		= _('Invalid security token! Please go back and try again.');

/*
 * =========================
 *  Directory/file settings
 * =========================
 */

	// The root directory, including the trailing slash, for Tinyboard.
	// examples: '/', 'http://boards.chan.org/', '/chan/'
	if (isset($_SERVER['REQUEST_URI']))
		$config['root']	 = (str_replace('\\', '/', dirname($_SERVER['REQUEST_URI'])) == '/' ? '/' : str_replace('\\', '/', dirname($_SERVER['REQUEST_URI'])) . '/');
	else
		$config['root'] = '/'; // CLI mode

	// If for some reason the folders and static HTML index files aren't in the current working direcotry,
	// enter the directory path here. Otherwise, keep it false.
	$config['root_file'] = false;

	$config['file_index'] = 'index.html';
	$config['file_page'] = '%d.html';
	$config['file_page50'] = '%d+50.html';
	$config['file_mod'] = 'mod.php';
	$config['file_post'] = 'post.php';
	$config['file_instance_script'] = 'instance.js';
	$config['file_main_script'] = 'js/main.js';

	// Board directory, followed by a forward-slash (/). (%s is board abbreviation)
	$config['board_path'] = '%s/';

	$config['dir']['img'] = 'src/';
	$config['dir']['thumb'] = 'thumb/';
	$config['dir']['res'] = 'res/';
	// For load balancing, having a seperate server (and domain/subdomain) for serving static content is possible.
	// This can either be a directory or a URL (eg. http://static.example.org/)
	//$config['dir']['static'] = $config['root'] . 'static/';
	// Where to store the .html templates. This folder and templates must exist or fatal errors will be thrown.
	$config['dir']['template'] = getcwd() . '/templates';
	// For the themes (homepages, etc.)
	$config['dir']['themes'] = getcwd() . '/templates/themes';
	// Same as above, but a URI (accessable by web interface, not locally)
	$config['dir']['themes_uri'] = 'templates/themes';
	// Homepage directory
	$config['dir']['home'] = '';

	// Static images
	// These can be URLs OR base64 (data URI scheme)
	//$config['image_sticky']	= $config['dir']['static'] . 'sticky.gif';
	//$config['image_locked']	= $config['dir']['static'] . 'locked.gif';
	//$config['image_bumplocked']	= $config['dir']['static'] . 'sage.gif';
	//$config['image_deleted']	= $config['dir']['static'] . 'deleted.';
	//$config['image_zip']		= $config['dir']['static'] . 'zip.';

	// If you want to put images and other dynamic-static stuff on another (preferably cookieless) domain, you can use this:
	// This will override $config['root'] and $config['dir']['...'] directives.
	// "%s" will get replaced with $board['dir'], which usually includes a trailing slash. To avoid double slashes, you don't need
	// to put a slash after %s
	// $config['uri_thumb'] = 'http://images.example.org/%sthumb/';
	// $config['uri_img'] = 'http://images.example.org/%ssrc/';

	// Set custom locations for stylesheets, scripts and maybe a banner.
	// This can be good for load balancing across multiple servers or hostnames.
	// $config['url_stylesheet'] = 'http://static.example.org/style.css'; // main/base stylesheet
	// $config['url_instance_script'] = 'http://static.example.org/instance.js';
	// $config['url_main_script'] = 'http://static.example.org/js/main.js';
	$config['url_favicon'] = '/static/flutter-icon.png';
	$config['url_favicon_alert'] = '/static/flutter-icon-new-replies.png';

/*
 * ====================
 *  Mod settings
 * ====================
 */

	// Whether or not to lock moderator sessions to the IP address that was logged in with.
	$config['mod']['lock_ip'] = false;

	// The page that is first shown when a moderator logs in. Defaults to the dashboard.
	$config['mod']['default'] = '/';

	// Don't even display MySQL password to administrators (in the configuration page).
	$config['mod']['never_reveal_password'] = true;

	// Mod links (full HTML)
	// Correspond to above permission directives
	$config['mod']['link_delete'] = '[D]';
	$config['mod']['link_ban'] = '[B]';
	$config['mod']['link_bandelete'] = '[B&amp;D]';
	$config['mod']['link_deletefile'] = '[F]';
	$config['mod']['link_deletebyip'] = '[D+]';
	$config['mod']['link_deletebyip_global'] = '[D++]';
	$config['mod']['link_bump'] = '[Bump]';
	$config['mod']['link_sticky'] = '[Sticky]';
	$config['mod']['link_desticky'] = '[-Sticky]';
	$config['mod']['link_lock'] = '[Lock]';
	$config['mod']['link_unlock'] = '[-Lock]';
	$config['mod']['link_bumplock'] = '[Sage]';
	$config['mod']['link_bumpunlock'] = '[-Sage]';
	$config['mod']['link_editpost'] = '[Edit]';
	$config['mod']['link_move'] = '[Move]';

	// Moderator capcodes
	$config['capcode'] = ' <span class="capcode">## %s</span>';

	// Custom capcodes, by example:
	// "## Custom" becomes lightgreen, italic and bold
	//$config['custom_capcode']['Custom'] ='<span class="capcode" style="color:lightgreen;font-style:italic;font-weight:bold"> ## %s</span>';

	$config['custom_capcode']['Founder'] = ' <span class="capcode founderCapcode">## %s</span>';

	// "## Mod" makes everything purple, including the name and tripcode
	//$config['custom_capcode']['Mod'] = array(
	//	'<span class="capcode" style="color:purple"> ## %s</span>',
	//	'color:purple', // Change name style; optional
	//	'color:purple' // Change tripcode style; optional
	//);

	// "## Admin" makes everything red and bold, including the name and tripcode
	//$config['custom_capcode']['Admin'] = array(
	//	'<span class="capcode" style="color:red;font-weight:bold"> ## %s</span>',
	//	'color:red;font-weight:bold', // Change name style; optional
	//	'color:red;font-weight:bold' // Change tripcode style; optional
	//);

	// Enable IP range bans (eg. "127.*.0.1", "127.0.0.*", and "12*.0.0.1" all match "127.0.0.1").
	// A little more load on the database
	$config['ban_range'] = true;

	// Enable CDIR netmask bans (eg. "10.0.0.0/8" for 10.0.0.0.0 - 10.255.255.255). Useful for stopping persistent spammers.
	// Again, a little more database load.
	$config['ban_cidr'] = true;

	// Message to show on posts edited by their author.
	$config['edit_self_message'] = '<div class="editmsg">This post was edited by its author on %s.</div>';
	// Message to show on posts edited by a moderator.
	$config['edit_mod_message'] = '<div class="editmsg">This post was edited by a moderator on %s.</div>';

	// Do a DNS lookup on IP addresses to get their hostname on the IP summary page
	$config['mod']['dns_lookup'] = true;
	// How many recent posts, per board, to show in the IP summary page
	$config['mod']['ip_recentposts'] = 5;
	// Maximum number of notes to show on an IP range search page.
	$config['mod']['ip_range_page_max_notes'] = 20;
	// Maximum number of bans to show on an IP range search page.
	$config['mod']['ip_range_page_max_bans'] = 5;
	// Maximum number of historic bans to show on an IP range search page.
	$config['mod']['ip_range_page_max_banhistory'] = 20;


	// How many posts to display on the reports page
	$config['mod']['recent_reports'] = 10;

	// How many actions to show per page in the moderation log
	$config['mod']['modlog_page'] = 350;
	// How many bans to show per page in the ban list
	$config['mod']['banlist_page'] = 350;
	// How many bans to show per page in the ban list
	$config['mod']['banhistory_page'] = 350;
	// How many notes to show per page in the notes list
	$config['mod']['noteslist_page'] = 350;
	// How many post to show per page in the post list
	$config['mod']['postlist_page'] = 50;

	// Number of news entries to display per page
	$config['mod']['news_page'] = 40;

	// Maximum number of results to display for a search, per board
	$config['mod']['search_results'] = 75;

	// How many entries to show per page in the moderator noticeboard
	$config['mod']['noticeboard_page'] = 50;
	// Number of entries to summarize and display on the dashboard
	$config['mod']['noticeboard_dashboard'] = 5;

	// Check public ban message by default
	$config['mod']['check_ban_message'] = false;
	// Default public ban message
	$config['mod']['default_ban_message'] = 'USER WAS BANNED FOR THIS POST';
	// What to append to the post for public bans ("%s" is the message)
	$config['mod']['ban_message'] = '<span class="public_ban">(%s)</span>';

	// When moving a thread to another board and choosing to keep a "shadow thread", an automated post (with a capcode) will
	// be made, linking to the new location for the thread. "%s" will be replaced with a standard cross-board post citation (>>>/board/xxx)
	$config['mod']['shadow_mesage'] = 'Moved to %s.';
	// Capcode to use when posting the above message.
	$config['mod']['shadow_capcode'] = 'Mod';
	// Name to use when posting the above message.
	$config['mod']['shadow_name'] = $config['anonymous'];

	// Wait indefinitely when rebuilding everything
	$config['mod']['rebuild_timelimit'] = 0;

	// PM snippet (for ?/inbox) length in characters
	$config['mod']['snippet_length'] = 75;

	// Probably best not to change these:
	if (!defined('JANITOR')) {
		define('FOUNDER', -2, true);
		define('DEVELOPER', -1, true);
		define('JANITOR',	0,	true);
		define('MOD',		1,	true);
		define('ADMIN',		2,	true);
		define('DISABLED',	3,	true);
	}

/*
 * ====================
 *  Mod permissions
 * ====================
 */

	// Capcode permissions
	$config['mod']['capcode'] = array(
		FOUNDER => array('Founder'),
		DEVELOPER => array('Developer'),
	//	JANITOR		=> array('Janitor'),
		MOD		=> array('Mod'),
		ADMIN		=> array('Admin', true)
	);

	// Example: Allow mods to post with "## Moderator" as well
	// $config['mod']['capcode'][MOD][] = 'Moderator';

	// Example: Allow janitors to post with any capcode
	// $config['mod']['capcode'][JANITOR] = true;

	// Set any of the below to "DISABLED" to make them unavailable for everyone.

	// Don't worry about per-board moderators. Let all mods moderate any board.
	$config['mod']['skip_per_board'] = false;

	/* Post Controls */
	// View IP addresses
	$config['permissions']['show_ip'] = MOD;
	// Delete a post
	$config['permissions']['delete'] = JANITOR;
	// Ban a user for a post
	$config['permissions']['ban'] = MOD;
	// Ban and delete (one click; instant)
	$config['permissions']['bandelete'] = MOD;
	// Remove bans
	$config['permissions']['unban'] = MOD;
	// Delete file (and keep post)
	$config['permissions']['deletefile'] = JANITOR;
	// Delete all posts by IP
	$config['permissions']['deletebyip'] = MOD;
	// Delete all posts by IP across all boards
	$config['permissions']['deletebyip_global'] = MOD;
	// Force-bump a thread
	$config['permissions']['bump'] = MOD;
	// Sticky a thread
	$config['permissions']['sticky'] = MOD;
	// Lock a thread
	$config['permissions']['lock'] = MOD;
	// Post in a locked thread
	$config['permissions']['postinlocked'] = MOD;
	// Prevent a thread from being bumped
	$config['permissions']['bumplock'] = MOD;
	// View whether a thread has been bumplocked ("-1" to allow non-mods to see too)
	$config['permissions']['view_bumplock'] = MOD;
	// Edit posts
	$config['permissions']['editpost'] = MOD;
	// Edit posts without leaving "Post was edited" message
	$config['permissions']['noeditmsg'] = ADMIN;
	// "Move" a thread to another board (EXPERIMENTAL; has some known bugs)
	$config['permissions']['move'] = MOD;
	// Bypass "field_disable_*" (forced anonymity, etc.)
	$config['permissions']['bypass_field_disable'] = MOD;
	// Bypass flood check
	$config['permissions']['flood'] = ADMIN;
	// Raw HTML posting
	$config['permissions']['rawhtml'] = MOD;

	/* Administration */
	// View the report queue
	$config['permissions']['reports'] = JANITOR;
	// Dismiss an abuse report
	$config['permissions']['report_dismiss'] = JANITOR;
	// Dismiss all abuse reports by an IP
	$config['permissions']['report_dismiss_ip'] = JANITOR;
	// Search posts
	$config['permissions']['search'] = DEVELOPER;
	// View bans
	$config['permissions']['view_ban'] = MOD;
	// View ban history
	$config['permissions']['view_banhistory'] = MOD;
	// View the username of the mod who made a ban
	$config['permissions']['view_banstaff'] = MOD;
	// If the moderator doesn't fit the $config['permissions']['view_banstaff''] (previous) permission,
	// show him just a "?" instead. Otherwise, it will be "Mod" or "Admin"
	$config['permissions']['view_banquestionmark'] = false;
	// View IP address notes
	$config['permissions']['view_notes'] = JANITOR;
	// Create notes
	$config['permissions']['create_notes'] = $config['permissions']['view_notes'];
	// Remote notes
	$config['permissions']['remove_notes'] = ADMIN;
	// Create a new board
	$config['permissions']['newboard'] = ADMIN;
	// Manage existing boards (change title, etc)
	$config['permissions']['manageboards'] = ADMIN;
	// Delete a board
	$config['permissions']['deleteboard'] = ADMIN;
	// List/manage users
	$config['permissions']['manageusers'] = MOD;
	// Promote/demote users
	$config['permissions']['promoteusers'] = ADMIN;
	// Edit any users' login information
	$config['permissions']['editusers'] = ADMIN;
	// Change user's own password
	$config['permissions']['change_password'] = -INF;
	// Delete a user
	$config['permissions']['deleteusers'] = ADMIN;
	// Create a user
	$config['permissions']['createusers'] = ADMIN;
	// View the moderation log
	$config['permissions']['modlog'] = ADMIN;
	// Create a PM (viewing mod usernames)
	$config['permissions']['create_pm'] = JANITOR;
	// Read any PM, sent to or from anybody
	$config['permissions']['master_pm'] = ADMIN;
	// Rebuild everything
	$config['permissions']['rebuild'] = ADMIN;
	// Search through posts
	$config['permissions']['search'] = JANITOR;
	// Read the moderator noticeboard
	$config['permissions']['noticeboard'] = JANITOR;
	// Post to the moderator noticeboard
	$config['permissions']['noticeboard_post'] = MOD;
	// Delete entries from the noticeboard
	$config['permissions']['noticeboard_delete'] = ADMIN;
	// Public ban messages; attached to posts
	$config['permissions']['public_ban'] = MOD;
	// Manage and install themes for homepage
	$config['permissions']['themes'] = ADMIN;
	// Post news entries
	$config['permissions']['news'] = ADMIN;
	// Custom name when posting news
	$config['permissions']['news_custom'] = ADMIN;
	// Delete news entries
	$config['permissions']['news_delete'] = ADMIN;

	// View the current configuration
	$config['permissions']['show_config'] = ADMIN;
	// Edit the current configuration (via web interface)
	$config['permissions']['edit_config'] = ADMIN;

	/* Backwards compatibility. TODO change places that depend on this to use
	   $config['permissions'] instead. */
	$config['mod'] = array_merge($config['mod'], $config['permissions']);

	$config['extra_permissions'][FOUNDER] = array('rawhtml');

/*
 * ====================
 *  Events (PHP 5.3.0+)
 * ====================
 */

	// http://tinyboard.org/docs/?p=Events

	// event_handler('post', function($post) {
	// 	// do something
	// });

	// event_handler('post', function($post) {
	// 	// do something else
	//
	// 	// return an error (reject post)
	// 	return 'Sorry, you cannot post that!';
	// });

/*
 * ====================
 *  Other/uncategorized
 * ====================
 */

	// Meta keywords. It's probably best to include these in per-board configurations.
	//$config['meta_keywords'] = 'chan,anonymous discussion,imageboard,tinyboard';

	// Link imageboard to your Google Analytics account to track users and provide marketing insights.
	// $config['google_analytics'] = 'UA-xxxxxxx-yy';
	// Keep the Google Analytics cookies to one domain -- ga._setDomainName()
	// $config['google_analytics_domain'] = 'www.example.org';

	// If you use Varnish, Squid, or any similar caching reverse-proxy in front of Tinyboard,
	// you can configure Tinyboard to PURGE files when they're written to
	//$config['purge'] = array(
	//	array('127.0.0.1', 80)
	//	array('127.0.0.1', 80, 'example.org')
	//);
	// Connection timeout, in seconds
	$config['purge_timeout'] = 3;

	// Remote server definitions
	//$config['remote']['static'] = array(
	//	'host' => 'static.example.org',
	//	'auth' => array(
	//		'method' => 'plain',
	//		'username' => 'username',
	//		'password' => 'password!123'
	//	),
	//	'type' => 'scp'
	//);

	// Complex regular expression to catch URLs
	$config['url_regex'] = '/' . '(https?|ftp):\/\/' . '(([\w\-]+\.)+[a-zA-Z]{2,6}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})' . '(:\d+)?' . '(\/([\w\-~.#\/?=&;:+%!*\[\]@$\'()+,|\^]+)?)?' . '/';
