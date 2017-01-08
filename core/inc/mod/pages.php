<?php

/*
 *  Copyright (c) 2010-2013 Tinyboard Development Group
 */

if (realpath($_SERVER['SCRIPT_FILENAME']) == str_replace('\\', '/', __FILE__)) {
	// You cannot request this file directly.
	exit;
}

function mod_page($title, $template, $args, $subtitle = false) {
	global $config, $mod;

	echo Element('page.html', array(
		'config' => $config,
		'mod' => $mod,
		'hide_dashboard_link' => $template == 'mod/dashboard.html',
		'title' => $title,
		'subtitle' => $subtitle,
		'boardlist' => createBoardlist($mod),
		'body' => Element($template,
				array_merge(
					array('config' => $config, 'mod' => $mod),
					$args
				)
			)
		)
	);
}

function mod_login() {
	global $config;

	$args = array();

	if (isset($_POST['login'])) {
		// Check if inputs are set and not empty
		if (!isset($_POST['username'], $_POST['password']) || !is_string($_POST['username']) || !is_string($_POST['password']) || $_POST['username'] == '' || $_POST['password'] == '') {
			$args['error'] = $config['error']['invalid'];
		} elseif (!login($_POST['username'], $_POST['password'])) {
			if ($config['syslog'])
				_syslog(LOG_WARNING, 'Unauthorized login attempt!');

			$args['error'] = $config['error']['invalid'];
		} else {
			modLog('Logged in', 2);

			// Login successful
			// Set cookies
			setCookies();

			header('Location: ?/', true, $config['redirect_http']);
			exit;
		}
	}

	if (isset($_POST['username']))
		$args['username'] = $_POST['username'];

	mod_page(_('Login'), 'mod/login.html', $args);
}

function mod_confirm($request) {
	mod_page(_('Confirm action'), 'mod/confirm.html', array('request' => $request, 'token' => make_secure_link_token($request)));
}

function mod_logout() {
	global $config, $mod;

	checkCsrf();

	destroyCookies();

	header('Location: ?/', true, $config['redirect_http']);
}

function mod_dashboard() {
	global $config, $mod;

	$args = array();

	$args['boards'] = listBoards();

	if (hasPermission('noticeboard')) {
		if (!$config['cache']['enabled'] || !$args['noticeboard'] = cache::get('noticeboard_preview')) {
			$query = prepare("SELECT `noticeboard`.*, `username` FROM `noticeboard` LEFT JOIN `mods` ON `mods`.`id` = `mod` ORDER BY `id` DESC LIMIT :limit");
			$query->bindValue(':limit', $config['mod']['noticeboard_dashboard'], PDO::PARAM_INT);
			$query->execute() or error(db_error($query));
			$args['noticeboard'] = $query->fetchAll(PDO::FETCH_ASSOC);

			if ($config['cache']['enabled'])
				cache::set('noticeboard_preview', $args['noticeboard']);
		}
	}

	if (!$config['cache']['enabled'] || ($args['unread_pms'] = cache::get('pm_unreadcount_' . $mod['id'])) == false) {
		$query = prepare('SELECT COUNT(*) FROM `pms` WHERE `to` = :id AND `unread` = 1');
		$query->bindValue(':id', $mod['id']);
		$query->execute() or error(db_error($query));
		$args['unread_pms'] = $query->fetchColumn(0);

		if ($config['cache']['enabled'])
			cache::set('pm_unreadcount_' . $mod['id'], $args['unread_pms']);
	}

	$query = query('SELECT COUNT(*) FROM `reports`') or error(db_error($query));
	$args['reports'] = $query->fetchColumn(0);

	$query = query('SELECT COUNT(*) AS count FROM `bans`
		WHERE status = 0 AND appealable AND
			(SELECT COUNT(*) FROM ban_appeals WHERE is_user = 1 AND
			ban_appeals.id = (SELECT MAX(id) FROM ban_appeals WHERE ban_appeals.ban = bans.id))') or error(db_error($query));
	$args['open_appeals'] = $query->fetchColumn(0);

	mod_page(_('Dashboard'), 'mod/dashboard.html', $args);
}

function mod_edit_board($boardName) {
	global $board, $config;

	if (!openBoard($boardName))
		error($config['error']['noboard']);

	if (!hasPermission('manageboards', $board['uri']))
			error($config['error']['noaccess']);

	if (isset($_POST['title'], $_POST['subtitle'])) {
		// Check the referrer
		checkCsrf();

		if (isset($_POST['delete'])) {
			if (!hasPermission('manageboards', $board['uri']))
				error($config['error']['deleteboard']);

			$query = prepare('DELETE FROM `boards` WHERE `uri` = :uri');
			$query->bindValue(':uri', $board['uri']);
			$query->execute() or error(db_error($query));

			if ($config['cache']['enabled']) {
				cache::delete('board_' . $board['uri']);
				cache::delete('all_boards');
			}

			modLog('Deleted board: ' . sprintf($config['board_abbreviation'], $board['uri']), 1, false);

			// Delete entire board directory
			rrmdir($board['uri'] . '/');

			// Delete posting table
			$query = query(sprintf('DROP TABLE IF EXISTS `posts_%s`', $board['uri'])) or error(db_error());

			// Clear reports
			$query = prepare('DELETE FROM `reports` WHERE `board` = :id');
			$query->bindValue(':id', $board['uri']);
			$query->execute() or error(db_error($query));

			// Delete from table
			$query = prepare('DELETE FROM `boards` WHERE `uri` = :uri');
			$query->bindValue(':uri', $board['uri']);
			$query->execute() or error(db_error($query));

			$query = prepare("SELECT `board`, `post` FROM `cites` WHERE `target_board` = :board AND `board` != :board");
			$query->bindValue(':board', $board['uri']);
			$query->execute() or error(db_error($query));

			$old_uri = $board['uri'];
			while ($cite = $query->fetch(PDO::FETCH_ASSOC)) {
				openBoard($cite['board']);
				rebuildPost($cite['post']);
			}
			openBoard($old_uri);

			$query = prepare('DELETE FROM `cites` WHERE `board` = :board OR `target_board` = :board');
			$query->bindValue(':board', $board['uri']);
			$query->execute() or error(db_error($query));

			// Remove board from users/permissions table
			$query = query('SELECT `id`,`boards` FROM `mods`') or error(db_error());
			while ($user = $query->fetch(PDO::FETCH_ASSOC)) {
				$user_boards = explode(',', $user['boards']);
				if (in_array($board['uri'], $user_boards)) {
					unset($user_boards[array_search($board['uri'], $user_boards)]);
					$_query = prepare('UPDATE `mods` SET `boards` = :boards WHERE `id` = :id');
					$_query->bindValue(':boards', implode(',', $user_boards));
					$_query->bindValue(':id', $user['id']);
					$_query->execute() or error(db_error($_query));
				}
			}
		} else {
			$query = prepare('UPDATE `boards` SET `title` = :title, `subtitle` = :subtitle WHERE `uri` = :uri');
			$query->bindValue(':uri', $board['uri']);
			$query->bindValue(':title', $_POST['title']);
			$query->bindValue(':subtitle', $_POST['subtitle']);
			$query->execute() or error(db_error($query));
		}

		if ($config['cache']['enabled']) {
			cache::delete('board_' . $board['uri']);
			cache::delete('all_boards');
		}

		rebuildThemes('boards');

		header('Location: ?/', true, $config['redirect_http']);
	} else {
		mod_page(sprintf('%s: ' . $config['board_abbreviation'], _('Edit board'), $board['uri']), 'mod/board.html', array('board' => $board));
	}
}

function mod_new_board() {
	global $config, $board;

	if (!hasPermission('newboard'))
		error($config['error']['noaccess']);

	if (isset($_POST['uri'], $_POST['title'], $_POST['subtitle'])) {
		checkCsrf();

		if ($_POST['uri'] == '')
			error(sprintf($config['error']['required'], 'URI'));

		if ($_POST['title'] == '')
			error(sprintf($config['error']['required'], 'title'));

		if (!preg_match('/^\w+$/', $_POST['uri']))
			error(sprintf($config['error']['invalidfield'], 'URI'));

		if (openBoard($_POST['uri'])) {
			error(sprintf($config['error']['boardexists'], $board['url']));
		}

		$query = prepare('INSERT INTO `boards` (`uri`, `title`, `subtitle`) VALUES (:uri, :title, :subtitle)');
		$query->bindValue(':uri', $_POST['uri']);
		$query->bindValue(':title', $_POST['title']);
		$query->bindValue(':subtitle', $_POST['subtitle']);
		$query->execute() or error(db_error($query));

		modLog('Created a new board: ' . sprintf($config['board_abbreviation'], $_POST['uri']));

		if (!openBoard($_POST['uri']))
			error(_("Couldn't open board after creation."));

		query(Element('posts.sql', array('board' => $board['uri']))) or error(db_error());

		if ($config['cache']['enabled'])
			cache::delete('all_boards');

		// Build the board
		buildIndex();

		rebuildThemes('boards');

		header('Location: ?/' . $board['uri'] . '/', true, $config['redirect_http']);
	}

	mod_page(_('New board'), 'mod/board.html', array('new' => true));
}

function mod_noticeboard($page_no = 1) {
	global $config, $pdo, $mod;

	if ($page_no < 1)
		error($config['error']['404']);

	if (!hasPermission('noticeboard'))
		error($config['error']['noaccess']);

	if (isset($_POST['subject'], $_POST['body'])) {
		checkCsrf();

		if (!hasPermission('noticeboard_post'))
			error($config['error']['noaccess']);

		markup($_POST['body']);

		$query = prepare('INSERT INTO `noticeboard` (`id`, `mod`, `time`, `subject`, `body`) VALUES (NULL, :mod, :time, :subject, :body)');
		$query->bindValue(':mod', $mod['id']);
		$query->bindvalue(':time', time());
		$query->bindValue(':subject', $_POST['subject']);
		$query->bindValue(':body', $_POST['body']);
		$query->execute() or error(db_error($query));

		if ($config['cache']['enabled'])
			cache::delete('noticeboard_preview');

		modLog('Posted a noticeboard entry');

		header('Location: ?/noticeboard#' . $pdo->lastInsertId(), true, $config['redirect_http']);
	}

	$query = prepare("SELECT `noticeboard`.*, `username` FROM `noticeboard` LEFT JOIN `mods` ON `mods`.`id` = `mod` ORDER BY `id` DESC LIMIT :offset, :limit");
	$query->bindValue(':limit', $config['mod']['noticeboard_page'], PDO::PARAM_INT);
	$query->bindValue(':offset', ($page_no - 1) * $config['mod']['noticeboard_page'], PDO::PARAM_INT);
	$query->execute() or error(db_error($query));
	$noticeboard = $query->fetchAll(PDO::FETCH_ASSOC);

	if (empty($noticeboard) && $page_no > 1)
		error($config['error']['404']);

	$query = prepare("SELECT COUNT(*) FROM `noticeboard`");
	$query->execute() or error(db_error($query));
	$count = $query->fetchColumn(0);

	mod_page(_('Noticeboard'), 'mod/noticeboard.html', array('noticeboard' => $noticeboard, 'count' => $count));
}

function mod_noticeboard_delete($id) {
	global $config;

	checkCsrf();

	if (!hasPermission('noticeboard_delete'))
			error($config['error']['noaccess']);

	$query = prepare('DELETE FROM `noticeboard` WHERE `id` = :id');
	$query->bindValue(':id', $id);
	$query->execute() or error(db_error($query));

	modLog('Deleted a noticeboard entry');

	if ($config['cache']['enabled'])
		cache::delete('noticeboard_preview');

	header('Location: ?/noticeboard', true, $config['redirect_http']);
}

function mod_news($page_no = 1) {
	global $config, $pdo, $mod;

	if ($page_no < 1)
		error($config['error']['404']);

	if (isset($_POST['subject'], $_POST['body'])) {
		checkCsrf();

		if (!hasPermission('news'))
			error($config['error']['noaccess']);

		markup($_POST['body']);

		$query = prepare('INSERT INTO `news` (`id`, `name`, `time`, `subject`, `body`) VALUES (NULL, :name, :time, :subject, :body)');
		$query->bindValue(':name', isset($_POST['name']) && hasPermission('news_custom') ? $_POST['name'] : $mod['username']);
		$query->bindvalue(':time', time());
		$query->bindValue(':subject', $_POST['subject']);
		$query->bindValue(':body', $_POST['body']);
		$query->execute() or error(db_error($query));

		modLog('Posted a news entry');

		rebuildThemes('news');

		header('Location: ?/news#' . $pdo->lastInsertId(), true, $config['redirect_http']);
	}

	$query = prepare("SELECT * FROM `news` ORDER BY `id` DESC LIMIT :offset, :limit");
	$query->bindValue(':limit', $config['mod']['news_page'], PDO::PARAM_INT);
	$query->bindValue(':offset', ($page_no - 1) * $config['mod']['news_page'], PDO::PARAM_INT);
	$query->execute() or error(db_error($query));
	$news = $query->fetchAll(PDO::FETCH_ASSOC);

	if (empty($news) && $page_no > 1)
		error($config['error']['404']);

	$query = prepare("SELECT COUNT(*) FROM `news`");
	$query->execute() or error(db_error($query));
	$count = $query->fetchColumn(0);

	mod_page(_('News'), 'mod/news.html', array('news' => $news, 'count' => $count));
}

function mod_news_delete($id) {
	global $config;

	checkCsrf();

	if (!hasPermission('news_delete'))
			error($config['error']['noaccess']);

	$query = prepare('DELETE FROM `news` WHERE `id` = :id');
	$query->bindValue(':id', $id);
	$query->execute() or error(db_error($query));

	modLog('Deleted a news entry');

	rebuildThemes('news');

	header('Location: ?/news', true, $config['redirect_http']);
}

function mod_log($page_no = 1) {
	global $config, $mod;

	if ($page_no < 1)
		error($config['error']['404']);

	if (!hasPermission('modlog'))
		error($config['error']['noaccess']);

	$query = prepare("SELECT `username`, `mod`, INET6_NTOA(`ip_data`) AS `ip`, `board`, `time`, `text` FROM `modlogs` LEFT JOIN `mods` ON `mod` = `mods`.`id` WHERE `permission_level` <= :permission_level ORDER BY `time` DESC LIMIT :offset, :limit");
	$query->bindValue(':permission_level', $mod['type'], PDO::PARAM_INT);
	$query->bindValue(':limit', $config['mod']['modlog_page'], PDO::PARAM_INT);
	$query->bindValue(':offset', ($page_no - 1) * $config['mod']['modlog_page'], PDO::PARAM_INT);
	$query->execute() or error(db_error($query));
	$logs = $query->fetchAll(PDO::FETCH_ASSOC);

	if (empty($logs) && $page_no > 1)
		error($config['error']['404']);

	$query = prepare("SELECT COUNT(*) FROM `modlogs` WHERE `permission_level` <= :permission_level");
	$query->bindValue(':permission_level', $mod['type'], PDO::PARAM_INT);
	$query->execute() or error(db_error($query));
	$count = $query->fetchColumn(0);

	mod_page(_('Moderation log'), 'mod/log.html', array('logs' => $logs, 'count' => $count));
}

function mod_user_log($username, $page_no = 1) {
	global $config, $mod;

	if ($page_no < 1)
		error($config['error']['404']);

	if (!hasPermission('modlog'))
		error($config['error']['noaccess']);

	$query = prepare("SELECT `username`, `mod`, INET6_NTOA(`ip_data`) AS `ip`, `board`, `time`, `text` FROM `modlogs` LEFT JOIN `mods` ON `mod` = `mods`.`id` WHERE `username` = :username AND `permission_level` <= :permission_level ORDER BY `time` DESC LIMIT :offset, :limit");
	$query->bindValue(':username', $username);
	$query->bindValue(':permission_level', $mod['type'], PDO::PARAM_INT);
	$query->bindValue(':limit', $config['mod']['modlog_page'], PDO::PARAM_INT);
	$query->bindValue(':offset', ($page_no - 1) * $config['mod']['modlog_page'], PDO::PARAM_INT);
	$query->execute() or error(db_error($query));
	$logs = $query->fetchAll(PDO::FETCH_ASSOC);

	if (empty($logs) && $page_no > 1)
		error($config['error']['404']);

	$query = prepare("SELECT COUNT(*) FROM `modlogs` LEFT JOIN `mods` ON `mod` = `mods`.`id` WHERE `username` = :username AND `permission_level` <= :permission_level");
	$query->bindValue(':username', $username);
	$query->bindValue(':permission_level', $mod['type'], PDO::PARAM_INT);
	$query->execute() or error(db_error($query));
	$count = $query->fetchColumn(0);

	mod_page(_('Moderation log'), 'mod/log.html', array('logs' => $logs, 'count' => $count, 'username' => $username));
}

function mod_view_board($boardName, $page_no = 1) {
	global $config, $mod;

	header("Cache-Control: private, max-age=5");

	if (!openBoard($boardName))
		error($config['error']['noboard']);

	if (!$page = index($page_no, $mod)) {
		error($config['error']['404']);
	}

	$page['pages'] = getPages(true);
	$page['pages'][$page_no-1]['selected'] = true;
	$page['btn'] = getPageButtons($page['pages'], true);
	$page['mod'] = $mod;
	$page['config'] = $config;

	echo Element('index.html', $page);
}

function mod_view_thread($boardName, $thread) {
	global $config, $mod;

	header("Cache-Control: private, max-age=5");

	if (!openBoard($boardName))
		error($config['error']['noboard']);

	if ($config['cache']['enabled']) {
		if (!($etag = cache::get("thread_etag_{$boardName}_{$thread}"))) {
			$etag = uniqid();
			cache::set("thread_etag_{$boardName}_{$thread}", $etag);
		} else if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === $etag) {
			header('HTTP/1.1 304 Not Modified');
			return;
		}
		header("Etag: ${etag}");
		header("X-CF-Dodge-Etag: ${etag}");
	}

	$page = buildThread($thread, true, $mod);
	echo $page;
}

function mod_view_thread50($boardName, $thread) {
	global $config, $mod;

	header("Cache-Control: private, max-age=5");

	if (!openBoard($boardName))
		error($config['error']['noboard']);

	if ($config['cache']['enabled']) {
		if (!($etag = cache::get("thread_etag_{$boardName}_{$thread}"))) {
			$etag = uniqid();
			cache::set("thread_etag_{$boardName}_{$thread}", $etag);
		} else if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === $etag) {
			header('HTTP/1.1 304 Not Modified');
			return;
		}
		header("Etag: ${etag}");
		header("X-CF-Dodge-Etag: ${etag}");
	}

	$page = buildThread50($thread, true, $mod);
	echo $page;
}

function expire_old_bans() {
	global $config;
	if (!$config['require_ban_view']) {
		$query = prepare("UPDATE `bans` SET `status` = 1 WHERE `status` = 0 AND `expires` IS NOT NULL AND `expires` < :time");
		$query->bindValue(':time', time());
		$query->execute() or error(db_error($query));
	}
}

function mod_ip_remove_note($mask_url, $id) {
	global $config, $mod;

	checkCsrf();

	if (!hasPermission('remove_notes'))
		error($config['error']['noaccess']);

	$query = prepare('SELECT `range_type`, INET6_NTOA(`range_start`) AS `range_start`, INET6_NTOA(`range_end`) AS `range_end` FROM `ip_notes` WHERE `id` = :id');
	$query->bindValue(':id', $id);
	$query->execute() or error(db_error($query));
	$range = $query->fetch(PDO::FETCH_ASSOC);
	if ($range === false) {
		error("Could not find note");
	}
	$mask = render_mask($range);
	$mask_url = mask_url($mask);

	$query = prepare('DELETE FROM `ip_notes` WHERE `id` = :id');
	$query->bindValue(':id', $id);
	$query->execute() or error(db_error($query));

	modLog("Removed a note for <a href=\"?/IP/$mask_url\">$mask</a>");

	header('Location: ?/IP/' . $mask_url . '#notes', true, $config['redirect_http']);
}

function mod_page_ip($mask_url) {
	global $config, $mod;

	$mask = str_replace('^', '/', $mask_url);
	$range = parse_mask($mask);
	if ($range === null)
		error('Invalid IP range.');

	if (isset($_POST['ban_id'], $_POST['unban'])) {
		checkCsrf();

		if (!hasPermission('unban'))
			error($config['error']['noaccess']);

		require_once 'inc/mod/ban.php';

		unban($_POST['ban_id']);

		header("Location: ?/IP/$mask_url#bans", true, $config['redirect_http']);
		return;
	}

	if (isset($_POST['note'])) {
		checkCsrf();

		if (!hasPermission('create_notes'))
			error($config['error']['noaccess']);

		markup($_POST['note']);
		$query = prepare('INSERT INTO `ip_notes` (`id`, `range_type`, `range_start`, `range_end`, `mod`, `time`, `body`) VALUES (NULL, :range_type, INET6_ATON(:range_start), INET6_ATON(:range_end), :mod, :time, :body)');
		$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
		$query->bindValue(':range_start', $range['range_start']);
		$query->bindValue(':range_end', $range['range_end']);
		$query->bindValue(':mod', $mod['id']);
		$query->bindValue(':time', time());
		$query->bindValue(':body', $_POST['note']);
		$query->execute() or error(db_error($query));

		modLog("Added a note for <a href=\"?/IP/$mask_url\">$mask</a>");

		header("Location: ?/IP/$mask_url#notes", true, $config['redirect_http']);
		return;
	}

	expire_old_bans();

	$args = array();
	$args['mask'] = $mask;
	$args['posts'] = array();

	if ($config['mod']['dns_lookup'] && filter_var($mask, FILTER_VALIDATE_IP) !== false)
		$args['hostname'] = rDNS($mask);

	$boards = listBoards();
	foreach ($boards as $board) {
		openBoard($board['uri']);
		if (!hasPermission('show_ip', $board['uri']))
			continue;

		$query = prepare(sprintf('SELECT *, INET6_NTOA(`ip_data`) AS `ip` FROM `posts_%s`
			WHERE `ip_type` = :range_type AND INET6_ATON(:range_start) <= `ip_data` AND `ip_data` <= INET6_ATON(:range_end)
			ORDER BY `id` DESC LIMIT :limit', $board['uri']));
		$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
		$query->bindValue(':range_start', $range['range_start']);
		$query->bindValue(':range_end', $range['range_end']);
		$query->bindValue(':limit', $config['mod']['ip_recentposts'], PDO::PARAM_INT);
		$query->execute() or error(db_error($query));

		while ($post = $query->fetch(PDO::FETCH_ASSOC)) {
			if (!$post['thread']) {
				// TODO: There is no reason why this should be such a fucking mess.
				$po = new Thread(
					$post['id'], $post['subject'], $post['email'], $post['email_protocol'], $post['name'], $post['trip'], $post['capcode'], $post['body'], $post['time'],
					$post['thumb'], $post['thumb_uri'], $post['thumbwidth'], $post['thumbheight'], $post['file'], $post['filetype'], $post['file_uri'], $post['filewidth'], $post['fileheight'], $post['filesize'],
					$post['filename'], $post['ip'], $post['sticky'], $post['locked'], $post['sage'], $post['embed'], $mod ? '?/' : $config['root'], $mod, true, $post['mature'], $post['anon_thread']
				);
			} else {
				$po = new Post(
					$post['id'], $post['thread'], $post['subject'], $post['email'], $post['email_protocol'], $post['name'], $post['trip'], $post['capcode'],
					$post['body'], $post['time'], $post['thumb'], $post['thumb_uri'], $post['thumbwidth'], $post['thumbheight'],
					$post['file'], $post['filetype'], $post['file_uri'], $post['filewidth'],
					$post['fileheight'], $post['filesize'], $post['filename'], $post['ip'],  $post['embed'], '?/', $mod, $post['mature']
				);
			}

			if (!isset($args['posts'][$board['uri']]))
				$args['posts'][$board['uri']] = array('board' => $board, 'posts' => array());
			$args['posts'][$board['uri']]['posts'][] = $po->build(true);
		}
	}

	$args['boards'] = $boards;
	$args['token'] = make_secure_link_token('ban');

	if (hasPermission('view_ban')) {
		$query = prepare('SELECT `bans`.*, INET6_NTOA(`range_start`) AS `range_start`, INET6_NTOA(`range_end`) AS `range_end`, `username`
			FROM `bans` LEFT JOIN `mods` ON `mod` = `mods`.`id`
			WHERE `status` = 0 AND `range_type` = :range_type AND `range_start` <= INET6_ATON(:range_end) AND `range_end` >= INET6_ATON(:range_start)
			ORDER BY (`expires` IS NOT NULL AND `expires` < :time), `set` DESC LIMIT :limit');
		$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
		$query->bindValue(':range_start', $range['range_start']);
		$query->bindValue(':range_end', $range['range_end']);
		$query->bindValue(':time', time());
		$query->bindValue(':limit', $config['mod']['ip_range_page_max_bans'], PDO::PARAM_INT);
		$query->execute() or error(db_error($query));
		$args['bans'] = $query->fetchAll(PDO::FETCH_ASSOC);

		foreach ($args['bans'] as &$ban) {
			$query = prepare('SELECT *, UNIX_TIMESTAMP(`timestamp`) AS `time` FROM `ban_appeals`
				WHERE `ban` = :id
				ORDER BY `timestamp`');
			$query->bindValue(':id', $ban['id']);
			$query->execute() or error(db_error($query));
			$ban['appeals'] = $query->fetchAll(PDO::FETCH_ASSOC);

			$ban['open_appeal'] = false;
			$appeal_count = count($ban['appeals']);
			$ban['open_appeal'] = $ban['appealable'] &&
				$appeal_count > 0 && $ban['appeals'][$appeal_count-1]['is_user'];
		}
	}

	if (hasPermission('view_banhistory')) {
		$query = prepare('SELECT `bans`.*, INET6_NTOA(`range_start`) AS `range_start`, INET6_NTOA(`range_end`) AS `range_end`, `username`
			FROM `bans` LEFT JOIN `mods` ON `mod` = `mods`.`id`
			WHERE `status` <> 0 AND `range_type` = :range_type AND `range_start` <= INET6_ATON(:range_end) AND `range_end` >= INET6_ATON(:range_start)
			ORDER BY `set` DESC LIMIT :limit');
		$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
		$query->bindValue(':range_start', $range['range_start']);
		$query->bindValue(':range_end', $range['range_end']);
		$query->bindValue(':limit', $config['mod']['ip_range_page_max_banhistory'], PDO::PARAM_INT);
		$query->execute() or error(db_error($query));
		$args['ban_history'] = $query->fetchAll(PDO::FETCH_ASSOC);
	}

	if (hasPermission('view_notes')) {
		$query = prepare('SELECT `ip_notes`.*, INET6_NTOA(`range_start`) AS `range_start`, INET6_NTOA(`range_end`) AS `range_end`, `username`
			FROM `ip_notes` LEFT JOIN `mods` ON `mod` = `mods`.`id`
			WHERE `range_type` = :range_type AND `range_start` <= INET6_ATON(:range_end) AND `range_end` >= INET6_ATON(:range_start)
			ORDER BY `time` DESC LIMIT :limit');
		$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
		$query->bindValue(':range_start', $range['range_start']);
		$query->bindValue(':range_end', $range['range_end']);
		$query->bindValue(':limit', $config['mod']['ip_range_page_max_notes'], PDO::PARAM_INT);
		$query->execute() or error(db_error($query));
		$args['notes'] = $query->fetchAll(PDO::FETCH_ASSOC);
	}

	mod_page(
		sprintf('%s: %s', _('IP'), $mask),
		'mod/view_ip.html', $args, isset($args['hostname']) ? $args['hostname'] : '');
}

function mod_ban() {
	global $config, $mod;

	if (!hasPermission('ban'))
		error($config['error']['noaccess']);

	if (!isset($_POST['mask'], $_POST['reason'], $_POST['length'], $_POST['board'], $_POST['ban_type'])) {
		mod_page(_('New ban'), 'mod/ban_form.html', array('token' => make_secure_link_token('ban'), 'mod' => $mod, 'boards' => listBoards()));
		return;
	}

	require_once 'inc/mod/ban.php';

	ban($_POST['mask'], $_POST['reason'], parse_time($_POST['length']), $_POST['board'] == '*' ? false : $_POST['board'], $_POST['ban_type'], isset($_POST['bansign']) && $_POST['bansign']);

	if (isset($_POST['redirect']))
		header('Location: ' . $_POST['redirect'], true, $config['redirect_http']);
	else
		header('Location: ?/', true, $config['redirect_http']);
}

function mod_bans($mask_url, $page = null, $no_system = null) {
	global $config;

	if ($page === null)
		$page_no = 1;
	else
		$page_no = $page;

	if ($page_no < 1)
		error($config['error']['404']);

	if (!hasPermission('view_ban'))
		error($config['error']['noaccess']);

	if (isset($_POST['unban'])) {
		checkCsrf();

		if (!hasPermission('unban'))
			error($config['error']['noaccess']);

		$unban = array();
		foreach ($_POST as $name => $unused) {
			if (preg_match('/^ban_(\d+)$/', $name, $match))
				$unban[] = $match[1];
		}

		require_once 'inc/mod/ban.php';

		foreach ($unban as $id) {
			unban($id);
		}

		$url = "?/bans";
		if ($mask_url != "") {
			$url .= "/$mask_url";
		}
		if ($page !== null) {
			$url .= "/$page";
		}
		header("Location: $url", true, $config['redirect_http']);
		return;
	}

	expire_old_bans();

	if ($mask_url == "" || $mask_url == "*") {
		$mask = null;
		$range = null;
		$range_query = "TRUE";
	} else {
		$mask = str_replace('^', '/', $mask_url);
		$range = parse_mask($mask);
		if ($range === null)
			error('Invalid IP range.');
		$range_query = "`range_type` = :range_type AND `range_start` <= INET6_ATON(:range_end) AND `range_end` >= INET6_ATON(:range_start)";
	}

	if ($no_system) {
		$range_query .= ' AND `mod` != -1';
	}

	$query = prepare(sprintf('SELECT `bans`.*, INET6_NTOA(`range_start`) AS `range_start`, INET6_NTOA(`range_end`) AS `range_end`,`username`,
	appealable AND (SELECT COUNT(*) FROM ban_appeals WHERE is_user = 1 AND
		ban_appeals.id = (SELECT MAX(id) FROM ban_appeals WHERE ban_appeals.ban = bans.id))
	AS open_appeals
		FROM `bans` LEFT JOIN `mods` ON `mod` = `mods`.`id`
		WHERE `status` = 0 AND %s
		ORDER BY open_appeals DESC, (`expires` IS NOT NULL AND `expires` < :time), `set` DESC LIMIT :offset, :limit', $range_query));
	if ($range !== null) {
		$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
		$query->bindValue(':range_start', $range['range_start']);
		$query->bindValue(':range_end', $range['range_end']);
	}
	$query->bindValue(':time', time(), PDO::PARAM_INT);
	$query->bindValue(':limit', $config['mod']['banlist_page'], PDO::PARAM_INT);
	$query->bindValue(':offset', ($page_no - 1) * $config['mod']['banlist_page'], PDO::PARAM_INT);
	$query->execute() or error(db_error($query));
	$bans = $query->fetchAll(PDO::FETCH_ASSOC);

	if (empty($bans) && $page_no > 1)
		error($config['error']['404']);

	$query = prepare(sprintf('SELECT COUNT(*) FROM `bans` WHERE `status` = 0 AND %s', $range_query));
	if ($range !== null) {
		$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
		$query->bindValue(':range_start', $range['range_start']);
		$query->bindValue(':range_end', $range['range_end']);
	}
	$query->execute() or error(db_error($query));
	$count = $query->fetchColumn(0);

	mod_page($mask ? sprintf(_('Bans for %s'), $mask) :_('Ban list'), 'mod/ban_list.html', array('bans' => $bans, 'count' => $count, 'mask' => $mask, 'no_system' => $no_system));
}

function mod_all_bans($no_system = null, $page_no = 1) {
	mod_bans('', $page_no, $no_system);
}

function mod_ban_history($mask_url, $page = null) {
	global $config;

	if ($page === null)
		$page_no = 1;
	else
		$page_no = $page;

	if ($page_no < 1)
		error($config['error']['404']);

	if (!hasPermission('view_banhistory'))
		error($config['error']['noaccess']);

	expire_old_bans();

	$mask = str_replace('^', '/', $mask_url);
	$range = parse_mask($mask);
	if ($range === null)
		error('Invalid IP range.');

	$query = prepare('SELECT `bans`.*, INET6_NTOA(`range_start`) AS `range_start`, INET6_NTOA(`range_end`) AS `range_end`,`username`
		FROM `bans` LEFT JOIN `mods` ON `mod` = `mods`.`id`
		WHERE `status` <> 0 AND `range_type` = :range_type AND `range_start` <= INET6_ATON(:range_end) AND `range_end` >= INET6_ATON(:range_start)
		ORDER BY `set` DESC LIMIT :offset, :limit');
	$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
	$query->bindValue(':range_start', $range['range_start']);
	$query->bindValue(':range_end', $range['range_end']);
	$query->bindValue(':limit', $config['mod']['banhistory_page'], PDO::PARAM_INT);
	$query->bindValue(':offset', ($page_no - 1) * $config['mod']['banhistory_page'], PDO::PARAM_INT);
	$query->execute() or error(db_error($query));
	$ban_history = $query->fetchAll(PDO::FETCH_ASSOC);

	if (empty($bans) && $page_no > 1)
		error($config['error']['404']);

	$query = prepare('SELECT COUNT(*) FROM `bans`
		WHERE `status` <> 0 AND `range_type` = :range_type AND `range_start` <= INET6_ATON(:range_end) AND `range_end` >= INET6_ATON(:range_start)');
	$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
	$query->bindValue(':range_start', $range['range_start']);
	$query->bindValue(':range_end', $range['range_end']);
	$query->execute() or error(db_error($query));
	$count = $query->fetchColumn(0);

	mod_page(sprintf(_('Ban history for %s'), $mask), 'mod/ban_history.html', array('ban_history' => $ban_history, 'count' => $count, 'mask' => $mask));
}

function mod_search() {
	global $config, $mod;

	if (isset($_POST['token'])) {
		if (!isset($_POST['name'], $_POST['trip'], $_POST['filename'])) {
			error($config['error']['missedafield']);
		}

		if (isset($_POST['nameSubmit'])) {
			$field = 'name';
			$search = globToSqlLike($_POST['name']);
		} elseif (isset($_POST['tripSubmit'])) {
			$field = 'trip';
			$search = globToSqlLike($_POST['trip']);
		} elseif (isset($_POST['filenameSubmit'])) {
			$field = 'filename';
			$search = globToSqlLike($_POST['filename']);
		} else {
			error($config['error']['missedafield']);
		}

		$boards = listBoards();
		$posts = array();
		foreach ($boards as $board) {
			openBoard($board['uri']);

			$query = prepare(sprintf('SELECT *, INET6_NTOA(`ip_data`) AS `ip` FROM `posts_%s`
				WHERE `%s` LIKE :query
				ORDER BY `id` DESC LIMIT :limit', $board['uri'], $field));
			$query->bindValue(':query', $search);
			$query->bindValue(':limit', $config['mod']['ip_recentposts'], PDO::PARAM_INT);
			$query->execute() or error(db_error($query));

			while ($post = $query->fetch(PDO::FETCH_ASSOC)) {
				if (!$post['thread']) {
					// TODO: There is no reason why this should be such a fucking mess.
					$po = new Thread(
						$post['id'], $post['subject'], $post['email'], $post['email_protocol'], $post['name'], $post['trip'], $post['capcode'], $post['body'], $post['time'],
						$post['thumb'], $post['thumb_uri'], $post['thumbwidth'], $post['thumbheight'], $post['file'], $post['filetype'], $post['file_uri'], $post['filewidth'], $post['fileheight'], $post['filesize'],
						$post['filename'], $post['ip'], $post['sticky'], $post['locked'], $post['sage'], $post['embed'], $mod ? '?/' : $config['root'], $mod, true, $post['mature'], $post['anon_thread']
					);
				} else {
					$po = new Post(
						$post['id'], $post['thread'], $post['subject'], $post['email'], $post['email_protocol'], $post['name'], $post['trip'], $post['capcode'],
						$post['body'], $post['time'], $post['thumb'], $post['thumb_uri'], $post['thumbwidth'], $post['thumbheight'],
						$post['file'], $post['filetype'], $post['file_uri'], $post['filewidth'],
						$post['fileheight'], $post['filesize'], $post['filename'], $post['ip'],  $post['embed'], '?/', $mod, $post['mature']
					);
				}

				if (!isset($posts[$board['uri']]))
					$posts[$board['uri']] = array('board' => $board, 'posts' => array());
				$posts[$board['uri']]['posts'][] = $po->build(true);
			}
		}

		mod_page(_('Search Results'), 'mod/view_posts.html', array(
			'posts' => $posts,
		));
	} else {
		$security_token = make_secure_link_token('search');
		mod_page(_('Search'), 'mod/search.html', array(
			'token' => $security_token
		));
	}
}

function mod_notes($mask_url, $page = null) {
	global $config;

	if ($page === null)
		$page_no = 1;
	else
		$page_no = $page;

	if ($page_no < 1)
		error($config['error']['404']);

	if (!hasPermission('view_notes'))
		error($config['error']['noaccess']);

	if (isset($_POST['remove_notes'])) {
		checkCsrf();

		if (!hasPermission('remove_notes'))
			error($config['error']['noaccess']);

		$notes = array();
		foreach ($_POST as $name => $unused) {
			if (preg_match('/^note_(\d+)$/', $name, $match))
				$notes[] = $match[1];
		}

		foreach ($notes as $note) {
			$query = prepare('SELECT `range_type`, INET6_NTOA(`range_start`) AS `range_start`, INET6_NTOA(`range_end`) AS `range_end` FROM `ip_notes` WHERE `id` = :id');
			$query->bindValue(':id', $note);
			$query->execute() or error(db_error($query));
			$range = $query->fetch(PDO::FETCH_ASSOC);
			if ($range === false) {
				continue;
			}
			$mask = render_mask($range);
			$mask_url = mask_url($mask);

			$query = prepare('DELETE FROM `ip_notes` WHERE `id` = :id');
			$query->bindValue(':id', $note);
			$query->execute() or error(db_error($query));

			modLog("Removed a note for <a href=\"?/IP/$mask_url\">$mask</a>");
		}

		$url = "?/notes/$mask_url";
		if ($page !== null) {
			$url .= "/$page";
		}
		header("Location: $url", true, $config['redirect_http']);
		return;
	}

	$mask = str_replace('^', '/', $mask_url);
	$range = parse_mask($mask);
	if ($range === null)
		error('Invalid IP range.');

	$query = prepare('SELECT `ip_notes`.*, INET6_NTOA(`range_start`) AS `range_start`, INET6_NTOA(`range_end`) AS `range_end`, `username`
		FROM `ip_notes` LEFT JOIN `mods` ON `mod` = `mods`.`id`
		WHERE `range_type` = :range_type AND `range_start` <= INET6_ATON(:range_end) AND `range_end` >= INET6_ATON(:range_start)
		ORDER BY `time` DESC LIMIT :offset, :limit');
	$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
	$query->bindValue(':range_start', $range['range_start']);
	$query->bindValue(':range_end', $range['range_end']);
	$query->bindValue(':limit', $config['mod']['noteslist_page'], PDO::PARAM_INT);
	$query->bindValue(':offset', ($page_no - 1) * $config['mod']['noteslist_page'], PDO::PARAM_INT);
	$query->execute() or error(db_error($query));
	$notes = $query->fetchAll(PDO::FETCH_ASSOC);

	if (empty($bans) && $page_no > 1)
		error($config['error']['404']);

	$query = prepare("SELECT COUNT(*) FROM `ip_notes`
		WHERE `range_type` = :range_type AND `range_start` <= INET6_ATON(:range_end) AND `range_end` >= INET6_ATON(:range_start)");
	$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
	$query->bindValue(':range_start', $range['range_start']);
	$query->bindValue(':range_end', $range['range_end']);
	$query->execute() or error(db_error($query));
	$count = $query->fetchColumn(0);

	mod_page(sprintf(_('Notes for %s'), $mask), 'mod/notes_list.html', array('notes' => $notes, 'count' => $count, 'mask' => $mask));
}

function mod_posts($mask_url, $boardName, $page = null) {
	global $config, $board, $mod;

	if (!openBoard($boardName))
		error($config['error']['noboard']);

	if (!hasPermission('show_ip', $board['uri']))
		error($config['error']['noaccess']);

	if ($page === null)
		$page_no = 1;
	else
		$page_no = $page;

	if ($page_no < 1)
		error($config['error']['404']);

	$mask = str_replace('^', '/', $mask_url);
	$range = parse_mask($mask);
	if ($range === null)
		error('Invalid IP range.');

	$query = prepare(sprintf('SELECT *, INET6_NTOA(`ip_data`) AS `ip` FROM `posts_%s`
		WHERE `ip_type` = :range_type AND INET6_ATON(:range_start) <= `ip_data` AND `ip_data` <= INET6_ATON(:range_end)
		ORDER BY `id` DESC LIMIT :offset, :limit', $board['uri']));
	$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
	$query->bindValue(':range_start', $range['range_start']);
	$query->bindValue(':range_end', $range['range_end']);
	$query->bindValue(':limit', $config['mod']['postlist_page'], PDO::PARAM_INT);
	$query->bindValue(':offset', ($page_no - 1) * $config['mod']['postlist_page'], PDO::PARAM_INT);
	$query->execute() or error(db_error($query));

	$posts = array();
	while ($post = $query->fetch(PDO::FETCH_ASSOC)) {
		if (!$post['thread']) {
			// TODO: There is no reason why this should be such a fucking mess.
			$po = new Thread(
				$post['id'], $post['subject'], $post['email'], $post['email_protocol'], $post['name'], $post['trip'], $post['capcode'], $post['body'], $post['time'],
				$post['thumb'], $post['thumb_uri'], $post['thumbwidth'], $post['thumbheight'], $post['file'], $post['filetype'], $post['file_uri'], $post['filewidth'], $post['fileheight'], $post['filesize'],
				$post['filename'], $post['ip'], $post['sticky'], $post['locked'], $post['sage'], $post['embed'], $mod ? '?/' : $config['root'], $mod, true, $post['mature'], $post['anon_thread']
			);
		} else {
			$po = new Post(
				$post['id'], $post['thread'], $post['subject'], $post['email'], $post['email_protocol'], $post['name'], $post['trip'], $post['capcode'],
				$post['body'], $post['time'], $post['thumb'], $post['thumb_uri'], $post['thumbwidth'], $post['thumbheight'],
				$post['file'], $post['filetype'], $post['file_uri'], $post['filewidth'],
				$post['fileheight'], $post['filesize'], $post['filename'], $post['ip'],  $post['embed'], '?/', $mod, $post['mature']
			);
		}

		$posts[] = $po->build(true);
	}

	if (empty($posts) && $page_no > 1)
		error($config['error']['404']);

	$query = prepare(sprintf('SELECT COUNT(*) FROM `posts_%s`
		WHERE `ip_type` = :range_type AND INET6_ATON(:range_start) <= `ip_data` AND `ip_data` <= INET6_ATON(:range_end)', $board['uri']));
	$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
	$query->bindValue(':range_start', $range['range_start']);
	$query->bindValue(':range_end', $range['range_end']);
	$query->execute() or error(db_error($query));
	$count = $query->fetchColumn(0);

	mod_page(sprintf(_('Posts in /%s/ for %s'), $board['uri'], $mask), 'mod/ip_board_post_list.html', array(
		'posts' => $posts,
		'count' => $count,
		'query' => $mask,
		'board' => $board['uri'],
		'return_url' => "?/IP/" . mask_url($mask),
		'return_title' => 'IP page',
		'page_url_prefix' => "?/posts/" . mask_url($mask) . "/" . $board['uri'] ."/",
	));
}

function mod_bump($board, $post) {
	global $config;

	$post = intval($post);

	if (!openBoard($board))
		error($config['error']['noboard']);

	if (!hasPermission('bump', $board))
		error($config['error']['noaccess']);

	bumpThread($post);
	buildThread($post);
	buildIndex();

	header('Location: ?/' . sprintf($config['board_path'], $board), true, $config['redirect_http']);
}

function mod_lock($board, $unlock, $post) {
	global $config;

	if (!openBoard($board))
		error($config['error']['noboard']);

	if (!hasPermission('lock', $board))
		error($config['error']['noaccess']);

	$query = prepare(sprintf('UPDATE `posts_%s` SET `locked` = :locked WHERE `id` = :id AND `thread` IS NULL', $board));
	$query->bindValue(':id', $post);
	$query->bindValue(':locked', $unlock ? 0 : 1);
	$query->execute() or error(db_error($query));
	if ($query->rowCount()) {
		modLog(($unlock ? 'Unlocked' : 'Locked') . " thread #{$post}");
		buildThread($post);
		buildIndex();
	}

	header('Location: ?/' . sprintf($config['board_path'], $board), true, $config['redirect_http']);

	if ($unlock)
		event('unlock', $post);
	else
		event('lock', $post);
}

function mod_sticky($board, $unsticky, $post) {
	global $config;

	if (!openBoard($board))
		error($config['error']['noboard']);

	if (!hasPermission('sticky', $board))
		error($config['error']['noaccess']);

	bumpThread($post);

	$query = prepare(sprintf('UPDATE `posts_%s` SET `sticky` = :sticky WHERE `id` = :id AND `thread` IS NULL', $board));
	$query->bindValue(':id', $post);
	$query->bindValue(':sticky', $unsticky ? 0 : 1);
	$query->execute() or error(db_error($query));
	if ($query->rowCount()) {
		modLog(($unsticky ? 'Unstickied' : 'Stickied') . " thread #{$post}");
		buildThread($post);
		buildIndex();
	}

	header('Location: ?/' . sprintf($config['board_path'], $board), true, $config['redirect_http']);
}

function mod_bumplock($board, $unbumplock, $post) {
	global $config;

	if (!openBoard($board))
		error($config['error']['noboard']);

	if (!hasPermission('bumplock', $board))
		error($config['error']['noaccess']);

	$query = prepare(sprintf('UPDATE `posts_%s` SET `sage` = :bumplock WHERE `id` = :id AND `thread` IS NULL', $board));
	$query->bindValue(':id', $post);
	$query->bindValue(':bumplock', $unbumplock ? 0 : 1);
	$query->execute() or error(db_error($query));
	if ($query->rowCount()) {
		modLog(($unbumplock ? 'Unbumplocked' : 'Bumplocked') . " thread #{$post}");
		buildThread($post);
		buildIndex();
	}

	header('Location: ?/' . sprintf($config['board_path'], $board), true, $config['redirect_http']);
}

function mod_mature($board, $unmature, $post) {
	global $config;

	if (!openBoard($board))
		error($config['error']['noboard']);

	if (!$config['mature_allowed'] || !hasPermission('setmature', $board))
		error($config['error']['noaccess']);

	db_beginTransaction();
	// Argh, hack. TODO make tag not actually be part of the post body.
	if ($unmature) {
		$query = prepare(sprintf('UPDATE `posts_%s` SET
			`body` = REGEXP_REPLACE(`body`, "<span class=\"hashtag\">#Mature</span>(<br/>)?", ""),
			`body_nomarkup` = IF(`body`=`body_nomarkup`,
				REGEXP_REPLACE(`body`, "<span class=\"hashtag\">#Mature</span>(<br/>)?", ""),
				REGEXP_REPLACE(`body_nomarkup`, "\\\[#Mature\\\]\n?", ""))
			WHERE `id` = :id AND `thread` IS NULL', $board));
	} else {
		$query = prepare(sprintf('UPDATE `posts_%s` SET
			`body` = CONCAT("<span class=\"hashtag\">#Mature</span><br/>", `body`),
			`body_nomarkup` = IF(`body`=`body_nomarkup`,
				CONCAT("<span class=\"hashtag\">#Mature</span><br/>", `body_nomarkup`),
				CONCAT("[#Mature]\n", `body_nomarkup`))
			WHERE `id` = :id AND `thread` IS NULL', $board));
	}
	$query->bindValue(':id', $post);
	$query->execute() or error(db_error($query));

	$query = prepare(sprintf('UPDATE `posts_%s` SET `mature` = :mature WHERE (`id` = :id AND `thread` IS NULL) OR `thread` = :id', $board));
	$query->bindValue(':id', $post);
	$query->bindValue(':mature', $unmature ? 0 : 1);
	$query->execute() or error(db_error($query));
	if ($query->rowCount()) {
		modLog("Set thread #{$post} to " . ($unmature?"not ":"") . "mature mode");
		db_commit();
		buildThread($post);
		buildIndex();
	} else {
		db_rollBack();
	}

	header('Location: ?/' . sprintf($config['board_path'], $board), true, $config['redirect_http']);
}

function mod_move($originBoard, $postID) {
	global $board, $config, $mod;

	if (!openBoard($originBoard))
		error($config['error']['noboard']);

	if (!hasPermission('move', $originBoard))
		error($config['error']['noaccess']);

	$query = prepare(sprintf('SELECT *, INET6_NTOA(`ip_data`) AS `ip` FROM `posts_%s` WHERE `id` = :id AND `thread` IS NULL', $originBoard));
	$query->bindValue(':id', $postID);
	$query->execute() or error(db_error($query));
	if (!$post = $query->fetch(PDO::FETCH_ASSOC))
		error($config['error']['404']);

	if (isset($_POST['board'])) {
		$targetBoard = $_POST['board'];
		$shadow = isset($_POST['shadow']);

		if ($targetBoard === $originBoard)
			error(_('Target and source board are the same.'));

		// hard link if leaving a shadow thread behind, else move it.
		$clone = $shadow ? 'link' : 'file_move_no_overwrite';

		// indicate that the post is a thread
		$post['op'] = true;

		if ($post['file']) {
			$post['has_file'] = true;
			$post['width'] = &$post['filewidth'];
			$post['height'] = &$post['fileheight'];

			$file_src = sprintf($config['board_path'], $board['uri']) . $config['dir']['img'] . $post['file'];
			$file_thumb = sprintf($config['board_path'], $board['uri']) . $config['dir']['thumb'] . $post['thumb'];
		} else {
			$post['has_file'] = false;
		}

		// allow thread to keep its same traits (stickied, locked, etc.)
		$post['mod'] = true;

		if (!openBoard($targetBoard))
			error($config['error']['noboard']);

		if ($post['has_file'] && file_exists($file_src)) {
			// copy image
			$limit = 1000;
			while (!@$clone($file_src, sprintf($config['board_path'], $board['uri']) . $config['dir']['img'] . $post['file'])) {
				if ($limit-- < 0) {
					error_log('Failed to ' . ($shadow?'copy':'move') . ' ' . $file_src . ' to ' . $post['file']);
					error('Failed to write a file');
				}
				$post['file'] = incrementFilename($post['file']);
				if (file_exists($file_thumb)) {
					$post['thumb'] = incrementFilename($post['thumb']);
				}
			}
			if (file_exists($file_thumb)) {
				$clone($file_thumb, sprintf($config['board_path'], $board['uri']) . $config['dir']['thumb'] . $post['thumb']);
			}
		}

		// create the new thread
		$newID = post($post);

		// go back to the original board to fetch replies
		openBoard($originBoard);

		$query = prepare(sprintf('SELECT *, INET6_NTOA(`ip_data`) AS `ip` FROM `posts_%s` WHERE `thread` = :id ORDER BY `id`', $originBoard));
		$query->bindValue(':id', $postID, PDO::PARAM_INT);
		$query->execute() or error(db_error($query));

		$replies = array();

		while ($post = $query->fetch()) {
			$post['mod'] = true;
			$post['thread'] = $newID;

			if ($post['file']) {
				$post['has_file'] = true;
				$post['width'] = &$post['filewidth'];
				$post['height'] = &$post['fileheight'];

				$post['file_src'] = sprintf($config['board_path'], $board['uri']) . $config['dir']['img'] . $post['file'];
				$post['file_thumb'] = sprintf($config['board_path'], $board['uri']) . $config['dir']['thumb'] . $post['thumb'];
			} else {
				$post['has_file'] = false;
			}

			$replies[] = $post;
		}

		$newIDs = array($postID => $newID);

		openBoard($targetBoard);

		foreach ($replies as &$post) {
			$query = prepare('SELECT `target` FROM `cites` WHERE `target_board` = :board AND `board` = :board AND `post` = :post');
			$query->bindValue(':board', $originBoard);
			$query->bindValue(':post', $post['id'], PDO::PARAM_INT);
			$query->execute() or error(db_error($qurey));

			// correct >>X links
			while ($cite = $query->fetch(PDO::FETCH_ASSOC)) {
				if (isset($newIDs[$cite['target']])) {
					$post['body_nomarkup'] = preg_replace(
							'/(>>(>\/' . preg_quote($originBoard, '/') . '\/)?)' . preg_quote($cite['target'], '/') . '/',
							'>>' . $newIDs[$cite['target']],
							$post['body_nomarkup']);

					$post['body'] = $post['body_nomarkup'];
				}
			}

			$post['body'] = $post['body_nomarkup'];

			$post['op'] = false;
			$post['tracked_cites'] = markup($post['body'], true, false);

			if ($post['has_file'] && file_exists($post['file_src'])) {
				// copy image
				$limit = 1000;
				while (!@$clone($post['file_src'], sprintf($config['board_path'], $board['uri']) . $config['dir']['img'] . $post['file'])) {
					if ($limit-- < 0) {
						error_log('Failed to ' . ($shadow?'copy':'move') . ' ' . $post['file_src'] . ' to ' . $post['file']);
						error('Failed to write a file');
					}
					$post['file'] = incrementFilename($post['file']);
					if (file_exists($post['file_thumb'])) {
						$post['thumb'] = incrementFilename($post['thumb']);
					}
				}
				if (file_exists($post['file_thumb'])) {
					$clone($post['file_thumb'], sprintf($config['board_path'], $board['uri']) . $config['dir']['thumb'] . $post['thumb']);
				}
			}

			// insert reply
			$newIDs[$post['id']] = $newPostID = post($post);

			foreach ($post['tracked_cites'] as $cite) {
				$query = prepare('INSERT INTO `cites` (`board`, `post`, `target_board`, `target`) VALUES (:board, :post, :target_board, :target)');
				$query->bindValue(':board', $board['uri']);
				$query->bindValue(':post', $newPostID, PDO::PARAM_INT);
				$query->bindValue(':target_board',$cite[0]);
				$query->bindValue(':target', $cite[1], PDO::PARAM_INT);
				$query->execute() or error(db_error($query));
			}
		}

		modLog("Moved thread &gt;&gt;&gt;/{$originBoard}/{$postID} to &gt;&gt;&gt;/{$targetBoard}/{$newID}");


		// build new thread
		buildThread($newID);

		clean();
		buildIndex();

		// trigger themes
		rebuildThemes('post');

		// return to original board
		openBoard($originBoard);

		if ($shadow) {
			// lock old thread
			$query = prepare(sprintf('UPDATE `posts_%s` SET `locked` = 1 WHERE `id` = :id', $originBoard));
			$query->bindValue(':id', $postID, PDO::PARAM_INT);
			$query->execute() or error(db_error($query));

			// leave a reply, linking to the new thread
			$post = array(
				'mod' => true,
				'subject' => '',
				'email' => '',
				'name' => $config['mod']['shadow_name'],
				'capcode' => $config['mod']['shadow_capcode'],
				'trip' => '',
				'userhash' => null,
				'password' => '',
				'has_file' => false,
				// attach to original thread
				'thread' => $postID,
				'op' => false
			);

			$post['body'] = $post['body_nomarkup'] =  sprintf($config['mod']['shadow_mesage'], '>>>/' . $targetBoard . '/' . $newID);

			markup($post['body']);

			$botID = post($post);
			buildThread($postID);

			buildIndex();

			header('Location: ?/' . sprintf($config['board_path'], $originBoard) . $config['dir']['res'] .sprintf($config['file_page'], $postID) .
				'#' . $botID, true, $config['redirect_http']);
		} else {
			deletePost($postID);
			buildIndex();

			openBoard($targetBoard);
			header('Location: ?/' . sprintf($config['board_path'], $board['uri']) . $config['dir']['res'] . sprintf($config['file_page'], $newID), true, $config['redirect_http']);
		}
		return;
	}

	$boards = listBoards();
	if (count($boards) <= 1)
		error(_('Impossible to move thread; there is only one board.'));

	$security_token = make_secure_link_token($originBoard . '/move/' . $postID);

	mod_page(_('Move thread'), 'mod/move.html', array('post' => $postID, 'board' => $originBoard, 'boards' => $boards, 'token' => $security_token));
}

function mod_ban_post($board, $delete, $post, $token = false) {
	global $config, $mod;

	if (!openBoard($board))
		error($config['error']['noboard']);

	if (!hasPermission('delete', $board))
		error($config['error']['noaccess']);

	$security_token = make_secure_link_token($board . '/ban/' . $post);

	$query = prepare(sprintf('SELECT INET6_NTOA(`ip_data`) AS `ip`, `thread` FROM `posts_%s` WHERE `id` = :id', $board));
	$query->bindValue(':id', $post);
	$query->execute() or error(db_error($query));
	if (!$_post = $query->fetch(PDO::FETCH_ASSOC))
		error($config['error']['404']);

	$thread = $_post['thread'];

	if (isset($_POST['new_ban'], $_POST['mask'], $_POST['reason'], $_POST['length'], $_POST['board'], $_POST['ban_type'])) {
		require_once 'inc/mod/ban.php';

		checkCsrf();

		$mask = $_POST['mask'];

		ban($mask, $_POST['reason'], parse_time($_POST['length']), $_POST['board'] == '*' ? false : $_POST['board'], $_POST['ban_type'], isset($_POST['bansign']) && $_POST['bansign']);

		if (isset($_POST['public_message'], $_POST['message'])) {
			// public ban message
			$query = prepare(sprintf('UPDATE `posts_%s` SET `body` = CONCAT(`body`, :body) WHERE `id` = :id', $board));
			$query->bindValue(':id', $post);
			$query->bindValue(':body', sprintf($config['mod']['ban_message'], utf8tohtml($_POST['message'])));
			$query->execute() or error(db_error($query));

			modLog("Attached a public ban message to post #{$post}: " . utf8tohtml($_POST['message']));
			buildThread($thread ? $thread : $post);
			buildIndex();
		} elseif (isset($_POST['delete']) && (int) $_POST['delete']) {
			// Delete post
			deletePost($post);
			modLog("Deleted post #{$post}");
			// Rebuild board
			buildIndex();
		}

		header('Location: ?/' . sprintf($config['board_path'], $board), true, $config['redirect_http']);
	}

	$mask = ipToUserRange($_post['ip']);

	$args = array(
		'mod' => $mod,
		'mask' => $mask,
		'hide_ip' => !hasPermission('show_ip', $board),
		'post' => $post,
		'board' => $board,
		'delete' => (bool)$delete,
		'boards' => listBoards(),
		'token' => $security_token
	);

	mod_page(_('New ban'), 'mod/ban_form.html', $args);
}

function mod_delete($board, $post) {
	global $config, $mod;

	if (!openBoard($board))
		error($config['error']['noboard']);

	if (!hasPermission('delete', $board))
		error($config['error']['noaccess']);

	// Delete post
	deletePost($post);
	// Record the action
	modLog("Deleted post #{$post}");
	// Rebuild board
	buildIndex();
	rebuildThemes('post');

	// Redirect
	header('Location: ?/' . sprintf($config['board_path'], $board), true, $config['redirect_http']);
}

function mod_deletefile($board, $post) {
	global $config, $mod;

	if (!openBoard($board))
		error($config['error']['noboard']);

	if (!hasPermission('deletefile', $board))
		error($config['error']['noaccess']);

	// Delete file
	deleteFile($post);
	// Record the action
	modLog("Deleted file from post #{$post}");

	// Rebuild board
	buildIndex();
	rebuildThemes('post');

	// Redirect
	header('Location: ?/' . sprintf($config['board_path'], $board), true, $config['redirect_http']);
}

function mod_edit($boardName, $post) {
	global $config, $mod, $board;

	if (!openBoard($boardName))
		error($config['error']['noboard']);

	if (!hasPermission('editpost', $board['uri']))
		error($config['error']['noaccess']);

	editPostForm($post, false, $mod);
}

function mod_deletebyip($boardName, $post, $global = false) {
	global $config, $mod, $board;

	$global = (bool)$global;

	if (!openBoard($boardName))
		error($config['error']['noboard']);

	if (!$global && !hasPermission('deletebyip', $boardName))
		error($config['error']['noaccess']);

	if ($global && !hasPermission('deletebyip_global', $boardName))
		error($config['error']['noaccess']);

	timing_mark('deletebyip:start');

	// Find IP address
	$query = prepare(sprintf('SELECT `ip_type`, INET6_NTOA(`ip_data`) AS `ip` FROM `posts_%s` WHERE `id` = :id', $boardName));
	$query->bindValue(':id', $post);
	$query->execute() or error(db_error($query));
	if (!$result = $query->fetch(PDO::FETCH_ASSOC))
		error($config['error']['invalidpost']);

	timing_mark('deletebyip:found ip');

	$ip = $result['ip'];
	$ip_type = $result['ip_type'];

	$boards = $global ? listBoards() : array(array('uri' => $boardName));

	$query = '';
	foreach ($boards as $_board) {
		$query .= sprintf("SELECT `thread`, `id`, '%s' AS `board` FROM `posts_%s` WHERE `ip_type` = :ip_type AND `ip_data` = INET6_ATON(:ip) UNION ALL ", $_board['uri'], $_board['uri']);
	}
	$query = preg_replace('/UNION ALL $/', '', $query);

	$query = prepare($query);
	$query->bindValue(':ip', $ip);
	$query->bindValue(':ip_type', $ip_type);
	$query->execute() or error(db_error($query));

	timing_mark('deletebyip:executed posts query');

	if ($query->rowCount() < 1)
		error($config['error']['invalidpost']);

	timing_mark('deletebyip:after row count');

	set_time_limit($config['mod']['rebuild_timelimit']);

	$posts_to_delete = array(); // {[board: string]: Array<number>}
	while ($post = $query->fetch()) {
		$posts_to_delete[$post['board']][] = $post['id'];
	}

	timing_mark('deletebyip:all fetched');

	foreach ($posts_to_delete as $_board => $_ids) {
		openBoard($_board);
		timing_mark("deletebyip:opened [$_board]");
		deletePosts($_ids, false, true);
		timing_mark("deletebyip:deleted posts [$_board]");
		buildIndex();
		timing_mark("deletebyip:built index [$_board]");
	}

	timing_mark('deletebyip:all deleted');

	rebuildThemes('post');

	timing_mark('deletebyip:rebuilt themes');

	if ($global) {
		$board = false;
	}

	// Record the action
	modLog("Deleted all posts by IP address: <a href=\"?/IP/$ip\">$ip</a>");

	// Redirect
	header('Location: ?/' . sprintf($config['board_path'], $boardName), true, $config['redirect_http']);
}

function mod_user($uid) {
	global $config, $mod;
	$selfEdit = $uid === $mod['id'];

	if (!hasPermission('editusers') && !$selfEdit)
		error($config['error']['noaccess']);

	$query = prepare('SELECT * FROM `mods` WHERE `id` = :id');
	$query->bindValue(':id', $uid);
	$query->execute() or error(db_error($query));
	if (!$user = $query->fetch(PDO::FETCH_ASSOC))
		error($config['error']['404']);

	if ($_SERVER['REQUEST_METHOD'] === 'GET') {
		if (hasPermission('modlog')) {
			$query = prepare('SELECT *, INET6_NTOA(`ip_data`) AS `ip` FROM `modlogs` WHERE `mod` = :id ORDER BY `time` DESC LIMIT 5');
			$query->bindValue(':id', $uid);
			$query->execute() or error(db_error($query));
			$log = $query->fetchAll(PDO::FETCH_ASSOC);
		} else {
			$log = array();
		}

		$user['boards'] = explode(',', $user['boards']);

		mod_page(_('Edit user'), 'mod/user.html', array('user' => $user, 'logs' => $log, 'boards' => listBoards()));
	} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
		checkCsrf();

		if (isset($_POST['delete'])) {
			if (!hasPermission('deleteusers'))
				error($config['error']['noaccess']);

			$query = prepare('DELETE FROM `mods` WHERE `id` = :id');
			$query->bindValue(':id', $uid);
			$query->execute() or error(db_error($query));

			modLog('Deleted user ' . utf8tohtml($user['username']) . ' <small>(#' . $user['id'] . ')</small>', 2);
		} else {
			if (isset($_POST['username'])) {
				if (!hasPermission('editusers'))
					error($config['error']['noaccess']);

				if ($_POST['username'] !== $user['username']) {
					mod_legal_username_check($_POST['username']);

					$query = prepare('UPDATE `mods` SET `username` = :username WHERE `id` = :id');
					$query->bindValue(':id', $uid);
					$query->bindValue(':username', $_POST['username']);
					$query->execute() or error(db_error($query));

					modLog('Renamed user "' . utf8tohtml($user['username']) . '" <small>(#' . $user['id'] . ')</small> to "' . utf8tohtml($_POST['username']) . '"');
					$user['username'] = $_POST['username'];

					if ($uid === $mod['id']) {
						login($user['username'], $user['password'], false);
						setCookies();
					}
				}
			}

			if (isset($_POST['allboards'])) {
				$boards = array('*');
			} else {
				$_boards = listBoards();
				foreach ($_boards as &$board) {
					$board = $board['uri'];
				}

				$boards = array();
				foreach ($_POST as $name => $value) {
					if (preg_match('/^board_(\w+)$/', $name, $matches) && in_array($matches[1], $_boards))
						$boards[] = $matches[1];
				}
				sort($boards);
			}

			$current_boards = explode(',', $user['boards']);
			sort($current_boards);

			if ($boards !== $current_boards) {
				if (!hasPermission('editusers'))
					error($config['error']['noaccess']);

				$query = prepare('UPDATE `mods` SET `boards` = :boards WHERE `id` = :id');
				$query->bindValue(':id', $uid);
				$query->bindValue(':boards', implode(',', $boards));
				$query->execute() or error(db_error($query));

				modLog('Changed boards of user "' . utf8tohtml($user['username']) . '" <small>(#' . $user['id'] . ')</small> to "' . utf8tohtml(implode(',', $boards)) . '"');
				$user['boards'] = implode(',', $boards);
			}

			if (isset($_POST['type'])) {
				if (!array_key_exists($_POST['type'], $config['mod']['ranks']))
					error("Invalid rank");

				if ($user['type'] !== $_POST['type']) {
					if (!hasPermission('promoteusers'))
						error($config['error']['noaccess']);

					$query = prepare('UPDATE `mods` SET `type` = :type WHERE `id` = :id');
					$query->bindValue(':id', $uid);
					$query->bindValue(':type', $_POST['type']);
					$query->execute() or error(db_error($query));

					modLog('Changed type of user "' . utf8tohtml($user['username']) . '" <small>(#' . $user['id'] . ')</small> to ' . utf8tohtml($config['mod']['ranks'][$_POST['type']]));
					$user['type'] = $_POST['type'];
				}
			}
		}

		if (hasPermission('manageusers'))
			header('Location: ?/users', true, $config['redirect_http']);
		else
			header('Location: ?/', true, $config['redirect_http']);
	} else {
		error('Invalid request method');
	}
}

function mod_user_new() {
	global $pdo, $config;

	checkCsrf();

	if (!hasPermission('createusers'))
		error($config['error']['noaccess']);

	if (isset($_POST['username'], $_POST['password'], $_POST['type'])) {
		mod_legal_username_check($_POST['username']);
		mod_legal_password_check($_POST['password']);

		if (isset($_POST['allboards'])) {
			$boards = array('*');
		} else {
			$_boards = listBoards();
			foreach ($_boards as &$board) {
				$board = $board['uri'];
			}

			$boards = array();
			foreach ($_POST as $name => $value) {
				if (preg_match('/^board_(\w+)$/', $name, $matches) && in_array($matches[1], $_boards))
					$boards[] = $matches[1];
			}
		}

		$_POST['type'] = (int) $_POST['type'];
		if (!in_array($_POST['type'], array(FOUNDER, DEVELOPER, JANITOR, MOD, ADMIN), true))
			error(sprintf($config['error']['invalidfield'], 'type'));

		$query = prepare('INSERT INTO `mods` (`id`, `username`, `password`, `type`, `boards`) VALUES (NULL, :username, SHA1(:password), :type, :boards)');
		$query->bindValue(':username', $_POST['username']);
		$query->bindValue(':password', $_POST['password']);
		$query->bindValue(':type', $_POST['type']);
		$query->bindValue(':boards', implode(',', $boards));
		$query->execute() or error(db_error($query));

		$userID = $pdo->lastInsertId();

		modLog('Created a new user: ' . utf8tohtml($_POST['username']) . ' <small>(#' . $userID . ')</small>', 2);

		header('Location: ?/users', true, $config['redirect_http']);
		return;
	}

	mod_page(_('New user'), 'mod/user.html', array('new' => true, 'boards' => listBoards()));
}

function mod_user_change_password($uid) {
	global $config, $mod;
	$selfEdit = $uid === $mod['id'];

	if (!hasPermission('editusers') && !$selfEdit || !hasPermission('change_password'))
		error($config['error']['noaccess']);

	$query = prepare('SELECT * FROM `mods` WHERE `id` = :id');
	$query->bindValue(':id', $uid);
	$query->execute() or error(db_error($query));
	if (!$user = $query->fetch(PDO::FETCH_ASSOC))
		error($config['error']['404']);

	if ($_SERVER['REQUEST_METHOD'] === 'GET') {
		mod_page(_('Change Password'), 'mod/user_change_password.html', array('user' => $user, 'boards' => listBoards()));
	} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
		checkCsrf();

		if (!isset($_POST['password'], $_POST['password2']))
			error($config['error']['missedafield']);

		if ($_POST['password'] !== $_POST['password2'])
			error("Passwords don't match!");

		mod_legal_password_check($_POST['password']);

		$query = prepare('UPDATE `mods` SET `password` = :password WHERE `id` = :id');
		$query->bindValue(':id', $uid);
		$query->bindValue(':password', sha1($_POST['password']));
		$query->execute() or error(db_error($query));

		modLog('Changed password for ' . utf8tohtml($user['username']) . ' <small>(#' . $user['id'] . ')</small>', 2);

		if ($uid === $mod['id']) {
			login($user['username'], $_POST['password']);
			setCookies();
		}

		header('Location: ?/users/' . $uid, true, $config['redirect_http']);
	}
}

function mod_user_change_signature($uid) {
	global $config, $mod;
	$selfEdit = $uid === $mod['id'];

	if (!hasPermission('editusers') && !$selfEdit || !hasPermission('change_password'))
		error($config['error']['noaccess']);

	$query = prepare('SELECT * FROM `mods` WHERE `id` = :id');
	$query->bindValue(':id', $uid);
	$query->execute() or error(db_error($query));
	if (!$user = $query->fetch(PDO::FETCH_ASSOC))
		error($config['error']['404']);

	if ($_SERVER['REQUEST_METHOD'] === 'GET') {
		mod_page(_('Change Password'), 'mod/user_change_signature.html', array('user' => $user, 'boards' => listBoards()));
	} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
		checkCsrf();

		if (!isset($_POST['name']))
			error($config['error']['missedafield']);

		$pair = generate_tripcode($_POST['name']);
		$name = $pair[0];
		$trip = isset($pair[1]) ? $pair[1] : '';

		$query = prepare('UPDATE `mods` SET `signed_name` = :name, `signed_trip` = :trip WHERE `id` = :id');
		$query->bindValue(':id', $uid);
		$query->bindValue(':name', $name);
		$query->bindValue(':trip', $trip);
		$query->execute() or error(db_error($query));

		modLog('Changed signature for ' . utf8tohtml($user['username']) . ' <small>(#' . $user['id'] . ')</small> to <span class="name">' . utf8tohtml($name) . '</span><span class="trip">' . utf8tohtml($trip) . '</span>');

		header('Location: ?/users/' . $uid, true, $config['redirect_http']);
	}
}

function mod_users() {
	global $config;

	if (!hasPermission('manageusers'))
		error($config['error']['noaccess']);

	$query = query("SELECT *, (SELECT `time` FROM `modlogs` WHERE `mod` = `id` ORDER BY `time` DESC LIMIT 1) AS `last`, (SELECT `text` FROM `modlogs` WHERE `mod` = `id` ORDER BY `time` DESC LIMIT 1) AS `action` FROM `mods` ORDER BY `type` DESC,`id`") or error(db_error());
	$users = $query->fetchAll(PDO::FETCH_ASSOC);

	mod_page(sprintf('%s (%d)', _('Manage users'), count($users)), 'mod/users.html', array('users' => $users));
}

function mod_pm($id, $reply = false) {
	global $mod, $config;

	checkCsrf();

	if ($reply && !hasPermission('create_pm'))
		error($config['error']['noaccess']);

	$query = prepare("SELECT `mods`.`username`, `mods_to`.`username` AS `to_username`, `pms`.* FROM `pms` LEFT JOIN `mods` ON `mods`.`id` = `sender` LEFT JOIN `mods` AS `mods_to` ON `mods_to`.`id` = `to` WHERE `pms`.`id` = :id");
	$query->bindValue(':id', $id);
	$query->execute() or error(db_error($query));

	if ((!$pm = $query->fetch(PDO::FETCH_ASSOC)) || ($pm['to'] != $mod['id'] && !hasPermission('master_pm')))
		error($config['error']['404']);

	if (isset($_POST['delete'])) {
		$query = prepare("DELETE FROM `pms` WHERE `id` = :id");
		$query->bindValue(':id', $id);
		$query->execute() or error(db_error($query));

		if ($config['cache']['enabled']) {
			cache::delete('pm_unread_' . $mod['id']);
			cache::delete('pm_unreadcount_' . $mod['id']);
		}

		header('Location: ?/', true, $config['redirect_http']);
		return;
	}

	if ($pm['unread'] && $pm['to'] == $mod['id']) {
		$query = prepare("UPDATE `pms` SET `unread` = 0 WHERE `id` = :id");
		$query->bindValue(':id', $id);
		$query->execute() or error(db_error($query));

		if ($config['cache']['enabled']) {
			cache::delete('pm_unread_' . $mod['id']);
			cache::delete('pm_unreadcount_' . $mod['id']);
		}

		modLog('Read a PM', 2);
	}

	if ($reply) {
		if (!$pm['to_username'])
			error($config['error']['404']); // deleted?

		mod_page(sprintf('%s %s', _('New PM for'), $pm['to_username']), 'mod/new_pm.html', array(
			'username' => $pm['username'], 'id' => $pm['sender'], 'message' => quote($pm['message'])
		));
	} else {
		mod_page(sprintf('%s &ndash; #%d', _('Private message'), $id), 'mod/pm.html', $pm);
	}
}

function mod_inbox() {
	global $config, $mod;

	$query = prepare('SELECT `unread`,`pms`.`id`, `time`, `sender`, `to`, `message`, `username` FROM `pms` LEFT JOIN `mods` ON `mods`.`id` = `sender` WHERE `to` = :mod ORDER BY `unread` DESC, `time` DESC');
	$query->bindValue(':mod', $mod['id']);
	$query->execute() or error(db_error($query));
	$messages = $query->fetchAll(PDO::FETCH_ASSOC);

	$query = prepare('SELECT COUNT(*) FROM `pms` WHERE `to` = :mod AND `unread` = 1');
	$query->bindValue(':mod', $mod['id']);
	$query->execute() or error(db_error($query));
	$unread = $query->fetchColumn(0);

	foreach ($messages as &$message) {
		$message['snippet'] = pm_snippet($message['message']);
	}

	mod_page(sprintf('%s (%s)', _('PM inbox'), count($messages) > 0 ? $unread . ' unread' : 'empty'), 'mod/inbox.html', array(
		'messages' => $messages,
		'unread' => $unread
	));
}


function mod_new_pm($username) {
	global $config, $mod;

	if (!hasPermission('create_pm'))
		error($config['error']['noaccess']);

	$query = prepare("SELECT `id` FROM `mods` WHERE `username` = :username");
	$query->bindValue(':username', $username);
	$query->execute() or error(db_error($query));
	if (!$id = $query->fetchColumn(0)) {
		// Old style ?/PM: by user ID
		$query = prepare("SELECT `username` FROM `mods` WHERE `id` = :username");
		$query->bindValue(':username', $username);
		$query->execute() or error(db_error($query));
		if ($username = $query->fetchColumn(0))
			header('Location: ?/new_PM/' . $username, true, $config['redirect_http']);
		else
			error($config['error']['404']);
	}

	if (isset($_POST['message'])) {
		checkCsrf();

		markup($_POST['message']);

		$query = prepare("INSERT INTO `pms` (`id`, `sender`, `to`, `message`, `time`, `unread`) VALUES (NULL, :me, :id, :message, :time, 1)");
		$query->bindValue(':me', $mod['id']);
		$query->bindValue(':id', $id);
		$query->bindValue(':message', $_POST['message']);
		$query->bindValue(':time', time());
		$query->execute() or error(db_error($query));

		if ($config['cache']['enabled']) {
			cache::delete('pm_unread_' . $id);
			cache::delete('pm_unreadcount_' . $id);
		}

		modLog('Sent a PM to ' . utf8tohtml($username), 2);

		header('Location: ?/', true, $config['redirect_http']);
	}

	mod_page(sprintf('%s %s', _('New PM for'), $username), 'mod/new_pm.html', array('username' => $username, 'id' => $id));
}

function mod_rebuild() {
	global $config, $twig;

	if (!hasPermission('rebuild'))
		error($config['error']['noaccess']);

	if (isset($_POST['rebuild'])) {
		checkCsrf();

		header('Content-type: text/html; charset=utf-8');
		set_time_limit($config['mod']['rebuild_timelimit']);
		ini_set("zlib.output_compression", 0);
?><!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<title>Rebuild</title>
</head>
<body>
<div>
<?php
		$boards = listBoards();
		$rebuilt_scripts = array();

		if (isset($_POST['rebuild_cache'])) {
			if ($config['cache']['enabled']) {
				echo "Flushing cache<br>\n";
				Cache::flush();
			}

			echo "Clearing template cache<br>\n";
			load_twig();
			$twig->clearCacheFiles();
		}

		if (isset($_POST['rebuild_javascript'])) {
			echo 'Rebuilding <strong>' . $config['file_instance_script'] . "</strong><br>\n";
			buildJavascript();
			$rebuilt_scripts[] = $config['file_instance_script'];
		}

		if (isset($_POST['rebuild_themes'])) {
			echo "Regenerating theme files<br>\n";
			rebuildThemes('all');
		}

		foreach ($boards as $board) {
			if (!(isset($_POST['boards_all']) || isset($_POST['board_' . $board['uri']])))
				continue;

			openBoard($board['uri']);

			if (isset($_POST['rebuild_index'])) {
				buildIndex();
				echo '<strong>' . sprintf($config['board_abbreviation'], $board['uri']) . "</strong>: Creating index pages<br>\n";
			}

			if (isset($_POST['rebuild_javascript']) && !in_array($config['file_instance_script'], $rebuilt_scripts)) {
				echo '<strong>' . sprintf($config['board_abbreviation'], $board['uri']) . '</strong>: Rebuilding <strong>' . $config['file_instance_script'] . "</strong><br>\n";
				buildJavascript();
				$rebuilt_scripts[] = $config['file_instance_script'];
			}

			if (isset($_POST['rebuild_thread'])) {
				$query = query(sprintf("SELECT `id` FROM `posts_%s` WHERE `thread` IS NULL", $board['uri'])) or error(db_error());
				while ($post = $query->fetch(PDO::FETCH_ASSOC)) {
					echo '<strong>' . sprintf($config['board_abbreviation'], $board['uri']) . '</strong>: Rebuilding thread #' . $post['id'] . "<br>\n";
					ob_flush();
					flush();
					buildThread($post['id']);
				}
			}
		}
?>
<p>
	<a href="?/rebuild">Go back and rebuild again</a>.
	<a href="?/">Go back to dashboard</a>.
</p>
</div>
</body>
</html>
<?php
		return;
	}

	mod_page(_('Rebuild'), 'mod/rebuild.html', array('boards' => listBoards()));
}

function mod_reports() {
	global $config, $mod;

	if (!hasPermission('reports'))
		error($config['error']['noaccess']);

	$query = prepare("SELECT *, INET6_NTOA(`ip_data`) AS `ip` FROM `reports` ORDER BY `time` DESC LIMIT :limit");
	$query->bindValue(':limit', $config['mod']['recent_reports'], PDO::PARAM_INT);
	$query->execute() or error(db_error($query));
	$reports = $query->fetchAll(PDO::FETCH_ASSOC);

	$report_queries = array();
	foreach ($reports as $report) {
		if (!isset($report_queries[$report['board']]))
			$report_queries[$report['board']] = array();
		$report_queries[$report['board']][] = $report['post'];
	}

	$report_posts = array();
	foreach ($report_queries as $board => $posts) {
		$report_posts[$board] = array();

		$query = query(sprintf('SELECT *, INET6_NTOA(`ip_data`) AS `ip` FROM `posts_%s` WHERE `id` = ' . implode(' OR `id` = ', $posts), $board)) or error(db_error());
		while ($post = $query->fetch()) {
			$report_posts[$board][$post['id']] = $post;
		}
	}

	$count = 0;
	$body = '';
	foreach ($reports as $report) {
		if (!isset($report_posts[$report['board']][$report['post']])) {
			// // Invalid report (post has since been deleted)
			$query = prepare("DELETE FROM `reports` WHERE `post` = :id AND `board` = :board");
			$query->bindValue(':id', $report['post'], PDO::PARAM_INT);
			$query->bindValue(':board', $report['board']);
			$query->execute() or error(db_error($query));
			continue;
		}

		openBoard($report['board']);

		$post = &$report_posts[$report['board']][$report['post']];

		if (!$post['thread']) {
			// Still need to fix this:
			$po = new Thread(
				$post['id'], $post['subject'], $post['email'], $post['email_protocol'], $post['name'], $post['trip'], $post['capcode'], $post['body'], $post['time'],
				$post['thumb'], $post['thumb_uri'], $post['thumbwidth'], $post['thumbheight'], $post['file'], $post['filetype'], $post['file_uri'], $post['filewidth'], $post['fileheight'], $post['filesize'],
				$post['filename'], $post['ip'], $post['sticky'], $post['locked'], $post['sage'], $post['embed'], $mod ? '?/' : $config['root'], $mod, true, $post['mature'], $post['anon_thread']
			);
		} else {
			$po = new Post(
				$post['id'], $post['thread'], $post['subject'], $post['email'], $post['email_protocol'], $post['name'], $post['trip'], $post['capcode'],
				$post['body'], $post['time'], $post['thumb'], $post['thumb_uri'], $post['thumbwidth'], $post['thumbheight'],
				$post['file'], $post['filetype'], $post['file_uri'], $post['filewidth'],
				$post['fileheight'], $post['filesize'], $post['filename'], $post['ip'],  $post['embed'], '?/', $mod, $post['mature']
			);
		}

		// a little messy and inefficient
		$append_html = Element('mod/report.html', array('report' => $report, 'config' => $config, 'mod' => $mod));

		// Bug fix for https://github.com/savetheinternet/Tinyboard/issues/21
		$po->body = truncate($po->body, $po->link(), $config['body_truncate'] - preg_match_all('/<br\b[^>]*>/', $append_html, $extra) - 1, false, true);

		if (mb_strlen($po->body) + mb_strlen($append_html) > $config['body_truncate_char']) {
			// still too long; temporarily increase limit in the config
			$__old_body_truncate_char = $config['body_truncate_char'];
			$config['body_truncate_char'] = mb_strlen($po->body) + mb_strlen($append_html);
		}

		$po->body .= $append_html;

		$body .= $po->build(true) . '<hr>';

		if (isset($__old_body_truncate_char))
			$config['body_truncate_char'] = $__old_body_truncate_char;

		$count++;
	}

	mod_page(sprintf('%s (%d)', _('Report queue'), $count), 'mod/reports.html', array('reports' => $body, 'count' => $count));
}

function mod_report_dismiss($id, $all = false) {
	global $config;

	checkCsrf();

	$query = prepare("SELECT `post`, `board`, INET6_NTOA(`ip_data`) AS `ip` FROM `reports` WHERE `id` = :id");
	$query->bindValue(':id', $id);
	$query->execute() or error(db_error($query));
	if ($report = $query->fetch(PDO::FETCH_ASSOC)) {
		$ip = $report['ip'];
		$board = $report['board'];
		$post = $report['post'];
	} else
		error($config['error']['404']);

	if (!$all && !hasPermission('report_dismiss', $board))
		error($config['error']['noaccess']);

	if ($all && !hasPermission('report_dismiss_ip', $board))
		error($config['error']['noaccess']);

	if ($all) {
		$ipRange = ipToUserRange($ip);
		$range = parse_mask($ipRange);
		$query = prepare("DELETE FROM `reports` WHERE `ip_type` = :range_type AND INET6_ATON(:range_start) <= `ip_data` AND `ip_data` <= INET6_ATON(:range_end)");
		$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
		$query->bindValue(':range_start', $range['range_start']);
		$query->bindValue(':range_end', $range['range_end']);
	} else {
		$query = prepare("DELETE FROM `reports` WHERE `id` = :id");
		$query->bindValue(':id', $id);
	}
	$query->execute() or error(db_error($query));


	if ($all)
		modLog("Dismissed all reports by <a href=\"?/IP/$ipRange\">$ipRange</a>");
	else
		modLog("Dismissed a report for post #{$id}", 1, $board);

	header('Location: ?/reports', true, $config['redirect_http']);
}


function mod_config() {
	global $config, $mod;

	if (!hasPermission('edit_config'))
		error($config['error']['noaccess']);

	require_once 'inc/mod/config-editor.php';

	$conf = config_vars();

	foreach ($conf as &$var) {
		if (is_array($var['name'])) {
			$c = $config;
			foreach ($var['name'] as $n)
				$c = $c[$n];
		} else {
			$c = $config[$var['name']];
		}

		$var['value'] = $c;
	}
	unset($var);

	if (isset($_POST['save'])) {
		checkCsrf();

		$config_append = '';

		foreach ($conf as $var) {
			$field_name = 'cf_' . (is_array($var['name']) ? implode('/', $var['name']) : $var['name']);

			if ($var['type'] == 'boolean')
				$value = isset($_POST[$field_name]);
			elseif (isset($_POST[$field_name]))
				$value = $_POST[$field_name];
			else
				continue; // ???

			if (!settype($value, $var['type']))
				continue; // invalid

			if ($value != $var['value']) {
				// This value has been changed.

				$config_append .= '$config';

				if (is_array($var['name'])) {
					foreach ($var['name'] as $name)
						$config_append .= '[' . var_export($name, true) . ']';
				} else {
					$config_append .= '[' . var_export($var['name'], true) . ']';
				}

				$config_append .= ' = ' . var_export($value, true) . ";\n";
			}
		}

		if (!empty($config_append)) {
			$config_append = "\n// Changes made via web editor by \"" . $mod['username'] . "\" @ " . date('r') . ":\n" . $config_append . "\n";

			if (!@file_put_contents('inc/instance-config.php', $config_append, FILE_APPEND)) {
				$config_append = htmlentities($config_append);

				if ($config['minify_html'])
					$config_append = str_replace("\n", '&#010;', $config_append);
				$page = array();
				$page['title'] = 'Cannot write to file!';
				$page['config'] = $config;
				$page['body'] = '
					<p style="text-align:center">Tinyboard could not write to <strong>inc/instance-config.php</strong> with the ammended configuration, probably due to a permissions error.</p>
					<p style="text-align:center">You may proceed with these changes manually by copying and pasting the following code to the end of <strong>inc/instance-config.php</strong>:</p>
					<textarea style="width:700px;height:370px;margin:auto;display:block;background:white;color:black" readonly>' . $config_append . '</textarea>
				';
				echo Element('page.html', $page);
				exit;
			}
		}

		header('Location: ?/', true, $config['redirect_http']);

		exit;
	}

	mod_page(_('Config editor'), 'mod/config-editor.html', array('conf' => $conf));
}

function mod_themes_list() {
	global $config;

	if (!hasPermission('themes'))
		error($config['error']['noaccess']);

	if (!is_dir($config['dir']['themes']))
		error(_('Themes directory doesn\'t exist!'));
	if (!$dir = opendir($config['dir']['themes']))
		error(_('Cannot open themes directory; check permissions.'));

	$query = query('SELECT `theme` FROM `theme_settings` WHERE `name` IS NULL AND `value` IS NULL') or error(db_error());
	$themes_in_use = $query->fetchAll(PDO::FETCH_COLUMN);

	// Scan directory for themes
	$themes = array();
	while ($file = readdir($dir)) {
		if ($file[0] != '.' && is_dir($config['dir']['themes'] . '/' . $file)) {
			$themes[$file] = loadThemeConfig($file);
		}
	}
	closedir($dir);

	mod_page(_('Manage themes'), 'mod/themes.html', array(
		'themes' => $themes,
		'themes_in_use' => $themes_in_use,
	));
}

function mod_theme_configure($theme_name) {
	global $config;

	if (!hasPermission('themes'))
		error($config['error']['noaccess']);

	if (!$theme = loadThemeConfig($theme_name)) {
		error($config['error']['invalidtheme']);
	}

	if (isset($_POST['install'])) {
		checkCsrf();

		// Check if everything is submitted
		foreach ($theme['config'] as &$conf) {
			if (!isset($_POST[$conf['name']]) && $conf['type'] != 'checkbox')
				error(sprintf($config['error']['required'], $c['title']));
		}

		// Clear previous settings
		$query = prepare("DELETE FROM `theme_settings` WHERE `theme` = :theme");
		$query->bindValue(':theme', $theme_name);
		$query->execute() or error(db_error($query));

		foreach ($theme['config'] as &$conf) {
			$query = prepare("INSERT INTO `theme_settings` (`theme`, `name`, `value`) VALUES(:theme, :name, :value)");
			$query->bindValue(':theme', $theme_name);
			$query->bindValue(':name', $conf['name']);
			$query->bindValue(':value', $_POST[$conf['name']]);
			$query->execute() or error(db_error($query));
		}

		$query = prepare("INSERT INTO `theme_settings` (`theme`, `name`, `value`) VALUES(:theme, NULL, NULL)");
		$query->bindValue(':theme', $theme_name);
		$query->execute() or error(db_error($query));

		$result = true;
		$message = false;
		if (isset($theme['install_callback'])) {
			$ret = $theme['install_callback'](themeSettings($theme_name));
			if ($ret && !empty($ret)) {
				if (is_array($ret) && count($ret) == 2) {
					$result = $ret[0];
					$message = $ret[1];
				}
			}
		}

		if (!$result) {
			// Install failed
			$query = prepare("DELETE FROM `theme_settings` WHERE `theme` = :theme");
			$query->bindValue(':theme', $theme_name);
			$query->execute() or error(db_error($query));
		}

		// Build themes
		rebuildThemes('all');

		mod_page(sprintf(_($result ? 'Installed theme: %s' : 'Installation failed: %s'), $theme['name']), 'mod/theme_installed.html', array(
			'theme_name' => $theme_name,
			'theme' => $theme,
			'result' => $result,
			'message' => $message,
		));
		return;
	}

	$settings = themeSettings($theme_name);

	mod_page(sprintf(_('Configuring theme: %s'), $theme['name']), 'mod/theme_config.html', array(
		'theme_name' => $theme_name,
		'theme' => $theme,
		'settings' => $settings,
	));
}

function mod_theme_uninstall($theme_name) {
	global $config;

	if (!hasPermission('themes'))
		error($config['error']['noaccess']);

	$query = prepare("DELETE FROM `theme_settings` WHERE `theme` = :theme");
	$query->bindValue(':theme', $theme_name);
	$query->execute() or error(db_error($query));

	header('Location: ?/themes', true, $config['redirect_http']);
}

function mod_theme_rebuild($theme_name) {
	global $config;

	checkCsrf();

	if (!hasPermission('themes'))
		error($config['error']['noaccess']);

	rebuildTheme($theme_name, 'all');

	mod_page(sprintf(_('Rebuilt theme: %s'), $theme_name), 'mod/theme_rebuilt.html', array(
		'theme_name' => $theme_name,
	));
}
