<?php

/*
 *  Copyright (c) 2010-2013 Tinyboard Development Group
 */

require 'inc/functions.php';
require 'inc/mod/auth.php';
require 'inc/mod/pages.php';

// Fix for magic quotes
if (get_magic_quotes_gpc()) {
	function strip_array($var) {
		return is_array($var) ? array_map('strip_array', $var) : stripslashes($var);
	}

	$_GET = strip_array($_GET);
	$_POST = strip_array($_POST);
}

header('X-Frame-Options: SAMEORIGIN');
header("Cache-Control: private");

$query = isset($_SERVER['QUERY_STRING']) ? $_SERVER['QUERY_STRING'] : '';

$pages = array(
	''					=> ':?/',		// redirect to dashboard
	'/'					=> 'dashboard',		// dashboard
	'/confirm/(.+)'				=> 'confirm',		// confirm action (if javascript didn't work)
	'/logout'				=> 'logout',		// logout

	'/users'				=> 'users',		// manage users
	'/users/(\d+)'				=> 'user',		// edit user
	'/users/(\d+)/change_password'	=> 'user_change_password',	// edit user password
	'/users/(\d+)/change_signature'	=> 'user_change_signature',	// edit user signature
	'/users/new'				=> 'user_new',		// create a new user
	'/new_PM/([^/]+)'			=> 'new_pm',		// create a new pm
	'/PM/(\d+)(/reply)?'			=> 'pm',		// read a pm
	'/inbox'				=> 'inbox',		// pm inbox

	'/noticeboard'				=> 'noticeboard',	// view noticeboard
	'/noticeboard/(\d+)'			=> 'noticeboard',	// view noticeboard
	'/noticeboard/delete/(\d+)'		=> 'noticeboard_delete',// delete from noticeboard
	'/log'					=> 'log',		// modlog
	'/log/(\d+)'				=> 'log',		// modlog
	'/log:([^/]+)'				=> 'user_log',		// modlog
	'/log:([^/]+)/(\d+)'			=> 'user_log',		// modlog
	'/news'					=> 'news',		// view news
	'/news/(\d+)'				=> 'news',		// view news
	'/news/delete/(\d+)'			=> 'news_delete',	// delete from news

	'/edit/(\w+)'				=> 'edit_board',	// edit board details
	'/new-board'				=> 'new_board',		// create a new board

	'/rebuild'				=> 'rebuild',		// rebuild static files
	'/reports'				=> 'reports',		// report queue
	'/reports/(\d+)/dismiss(all)?'		=> 'report_dismiss',	// dismiss a report

	'/IP/([\w.:*^]+)'			=> 'ip',		// view ip address
	'/IP/([\w.:*^]+)/remove_note/(\d+)'	=> 'ip_remove_note',	// remove note from ip address
	'/bans'					=> 'all_bans',		// ban list
	'/bans/(\d+)'				=> 'all_bans',		// ban list
	'/bans/([\w.:*^]+)'			=> 'bans',		// ip ban list
	'/bans/([\w.:*^]+)/(\d+)'		=> 'bans',		// ip ban list
	'/banhistory/([\w.:*^]+)'		=> 'ban_history',	// ip ban history list
	'/banhistory/([\w.:*^]+)/(\d+)'		=> 'ban_history',	// ip ban history list
	'/notes/([\w.:*^]+)'			=> 'notes',		// ip notes list
	'/notes/([\w.:*^]+)/(\d+)'		=> 'notes',		// ip notes list
	'/posts/([\w.:*^]+)/(\w+)'		=> 'posts',		// ip post list
	'/posts/([\w.:*^]+)/(\w+)/(\d+)'	=> 'posts',		// ip post list

	'/search'					=> 'secure_POST search',		// search page

	'/(\w+)/edit/(\d+)'			=> 'edit',		// edit post

	// CSRF-protected moderator actions
	'/ban'					=> 'secure_POST ban',	// new ban
	'/(\w+)/ban(&delete)?/(\d+)'		=> 'secure_POST ban_post', // ban poster
	'/(\w+)/move/(\d+)'			=> 'secure_POST move',	// move thread
	'/(\w+)/delete/(\d+)'			=> 'secure delete',	// delete post
	'/(\w+)/deletefile/(\d+)'		=> 'secure deletefile',	// delete file from post
	'/(\w+)/deletebyip/(\d+)(/global)?'	=> 'secure deletebyip',	// delete all posts by IP address
	'/(\w+)/bump/(\d+)'			=> 'secure bump',	// force bump thread
	'/(\w+)/(un)?lock/(\d+)'		=> 'secure lock',	// lock thread
	'/(\w+)/(un)?mature/(\d+)'		=> 'secure mature',	// toggle mature tag on thread
	'/(\w+)/(un)?sticky/(\d+)'		=> 'secure sticky',	// sticky thread
	'/(\w+)/bump(un)?lock/(\d+)'		=> 'secure bumplock',	// "bumplock" thread

	'/themes'				=> 'themes_list',	// manage themes
	'/themes/(\w+)'				=> 'theme_configure',	// configure/reconfigure theme
	'/themes/(\w+)/rebuild'			=> 'theme_rebuild',	// rebuild theme
	'/themes/(\w+)/uninstall'		=> 'theme_uninstall',	// uninstall theme

	'/config'				=> 'config',		// config editor

	// This should always be at the end:
	'/(\w+)/'										=> 'view_board',
	'/(\w+)/' . str_replace('%d', '(\d+)', preg_quote($config['file_page'], '!'))		=> 'view_board',
	'/(\w+)/' . preg_quote($config['dir']['res'], '!') .
			str_replace('%d', '(\d+)', preg_quote($config['file_page50'], '!'))	=> 'view_thread50',
	'/(\w+)/' . preg_quote($config['dir']['res'], '!') .
			str_replace('%d', '(\d+)', preg_quote($config['file_page'], '!'))	=> 'view_thread',
);


if (!$mod) {
	$pages = array('!!' => 'login');
}

if (isset($config['mod']['custom_pages'])) {
	$pages = array_merge($pages, $config['mod']['custom_pages']);
}

$new_pages = array();
foreach ($pages as $key => $callback) {
	if ($_SERVER['REQUEST_METHOD'] === 'GET' && preg_match('/^secure /', $callback))
		$key .= '(/(?P<token>[a-f0-9]{8}))?';
	$new_pages[@$key[0] == '!' ? $key : '!^' . $key . '(?:&[^&=]+=[^&]*)*$!'] = $callback;
}
$pages = $new_pages;

foreach ($pages as $uri => $handler) {
	if (preg_match($uri, $query, $matches)) {
		$matches = array_map('urldecode', array_slice($matches, 1));

		if (preg_match('/^secure(_POST)? /', $handler, $m)) {
			$secure_post_only = isset($m[1]);
			function hasCsrfHeader() {
				// You can't csrf with extra headers against your target.
				return (isset($_SERVER['HTTP_X_REQUESTED_WITH'])) &&
					strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
			}
			if (!$secure_post_only || $_SERVER['REQUEST_METHOD'] === 'POST') {
				if (isset($matches['token'])) {
					$token = $matches['token'];
					$actual_query = preg_replace('!/([a-f0-9]{8})$!', '', $query);

				} else {
					$token = isset($_POST['token']) ? $_POST['token'] : false;
					$actual_query = $query;
				}

				if ($token === false && !hasCsrfHeader()) {
					if ($secure_post_only)
						error($config['error']['csrf']);
					else {
						mod_confirm(substr($query, 1));
						exit;
					}
				}

				// CSRF-protected page; validate security token
				if ($token !== make_secure_link_token(substr($actual_query, 1)) && !hasCsrfHeader()) {
					error($config['error']['csrf']);
				}
			}
			$handler = preg_replace('/^secure(_POST)? /', '', $handler);
		}

		if ($config['debug']) {
			$debug['mod_page'] = array(
				'req' => $query,
				'match' => $uri,
				'handler' => $handler
			);
		}

		if (is_string($handler)) {
			if ($handler[0] == ':') {
				header('Location: ' . substr($handler, 1),  true, $config['redirect_http']);
			} elseif (is_callable("mod_page_$handler")) {
				call_user_func_array("mod_page_$handler", $matches);
			} elseif (is_callable("mod_$handler")) {
				call_user_func_array("mod_$handler", $matches);
			} else {
				error("Mod page '$handler' not found!");
			}
		} elseif (is_callable($handler)) {
			call_user_func_array($handler, $matches);
		} else {
			error("Mod page '$handler' not a string, and not callable!");
		}

		exit;
	}
}

error($config['error']['404']);
