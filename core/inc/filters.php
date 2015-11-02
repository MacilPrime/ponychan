<?php

/*
 *  Copyright (c) 2010-2013 Tinyboard Development Group
 */

if (realpath($_SERVER['SCRIPT_FILENAME']) == str_replace('\\', '/', __FILE__)) {
	// You cannot request this file directly.
	exit;
}

function do_filters(array $post) {
	$filters = get_active_filters();

	foreach ($filters as $filter) {
		if (!postMatchesConditions($filter['conditions'], $post)) {
			continue;
		}
		applyFilterAction($filter['action']);
	}
}

function get_active_filters() {
	global $config;

	if ($config['cache']['enabled'] && ($filters = cache::get('active_post_filters'))) {
		return $filters;
	}

	$query = query("SELECT `id`, `filter_json`, `mode` FROM `post_filters` WHERE `mode` != 0") or error(db_error());
	$filters = array_map(function($row) {
		$data = json_decode($row['filter_json'], true);
		return [
			'id' => $row['id'],
			'mode' => $row['mode'],
			'conditions' => $data['conditions'],
			'action' => $data['action']
		];
	}, $query->fetchAll(PDO::FETCH_ASSOC));

	if ($config['cache']['enabled']) {
		cache::set('active_post_filters', $filters);
	}

	return $filters;
}

function postMatchesConditions($conditions, $post) {
	foreach($conditions as $condition) {
		if (!postMatchesCondition($condition, $post)) {
			return false;
		}
	}
	return true;
}

function postMatchesCondition($condition, $post) {
	switch ($condition['type']) {
		case 'name':
			return preg_match($condition['value'], $post['name']);
		case 'trip':
			return $condition['value'] === $post['trip'];
		case 'email':
			return preg_match($condition['value'], $post['email']);
		case 'subject':
			return preg_match($condition['value'], $post['subject']);
		case 'body':
			return preg_match($condition['value'], $post['body']);
		case 'filename':
			if (!$post['has_file'])
				return false;
			return preg_match($condition['value'], $post['filename']);
		case 'extension':
			if (!$post['has_file'])
				return false;
			return preg_match($condition['value'], $post['body']);
		case 'ip':
			return preg_match($condition['value'], $_SERVER['REMOTE_ADDR']);
		case 'op':
			return $post['op'] === $condition['value'];
		case 'has_file':
			return $post['has_file'] === $condition['value'];
		case 'first_time_poster':
			return $condition['value'] !== userHasPosts($post['ip'], $post['userhash']);
		case 'has_not_solved_captcha_in_x_minutes':
			// TODO
			return true;
		default:
			error_log('Unknown filter condition: ' . $condition['type']);
	}
	return false;
}

function applyFilterAction($action) {
	global $board;

	switch($action['type']) {
		case 'reject':
			error((isset($action['message']) && $action['message'] !== null) ?
				$action['message'] : 'Posting throttled by flood filter.');
		case 'captcha':
			// TODO
			break;
		case 'ban':
			if (!isset($action['reason']))
				error('The ban action requires a reason.');

			$reason = $action['reason'];

			if (isset($action['length']))
				$expires = time() + $action['length'];
			else
				$expires = 0; // Ban indefinitely

			$single_board = (isset($action['single_board']) && $action['single_board']);

			$range = parse_mask(ipToUserRange($_SERVER['REMOTE_ADDR']));

			if (isset($action['ban_type']))
				$ban_type = $action['ban_type'];
			else
				$ban_type = FULL_BAN;

			$query = prepare("INSERT INTO `bans` (`status`, `range_type`,`range_start`,`range_end`,`mod`,`set`,`expires`,`reason`,`board`,`ban_type`) VALUES (0, :range_type, INET6_ATON(:range_start), INET6_ATON(:range_end), :mod, :set, :expires, :reason, :board, :ban_type)");
			$query->bindValue(':range_type', $range['range_type'], PDO::PARAM_INT);
			$query->bindValue(':range_start', $range['range_start']);
			$query->bindValue(':range_end', $range['range_end']);
			$query->bindValue(':mod', -1);
			$query->bindValue(':set', time(), PDO::PARAM_INT);
			$query->bindValue(':ban_type', $ban_type);

			if ($expires)
				$query->bindValue(':expires', $expires);
			else
				$query->bindValue(':expires', null, PDO::PARAM_NULL);

			if ($reason)
				$query->bindValue(':reason', $reason);
			else
				$query->bindValue(':reason', null, PDO::PARAM_NULL);

			if ($single_board)
				$query->bindValue(':board', $board['uri']);
			else
				$query->bindValue(':board', null, PDO::PARAM_NULL);

			$query->execute() or error(db_error($query));

			if (isset($action['message']))
				error($message);

			checkBan($board['uri']);
			error('This should not happen');
		default:
			error('Unknown filter action: ' . $action['type']);
	}
}
