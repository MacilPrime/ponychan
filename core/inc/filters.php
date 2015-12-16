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
		switch($filter['mode']) {
			case 1: // audit
				log_filter_hit($post, $filter['id'], false);
				break;
			case 2: // enforce
				log_filter_hit($post, $filter['id'], true);
				applyFilterAction($filter['action']);
				break;
			default:
				error_log('Unknown filter mode: ' . $filter['mode']);
		}
	}
}

function log_filter_hit(array $post, $filter_id, $blocked) {
	$do_insert = function(array $post) use ($filter_id, $blocked) {
		global $board, $config;

		$query = prepare("INSERT INTO `post_filter_hits` (`userhash`, `ip_type`, `ip_data`, `filter_id`, `blocked`, `board`, `successful_post_id`, `thread`, `subject`, `email`, `name`, `trip`, `capcode`, `filename`, `filehash`, `body_nomarkup`) VALUES (:userhash, :ip_type, INET6_ATON(:ip), :filter_id, :blocked, :board, :successful_post_id, :thread, :subject, :email, :name, :trip, :capcode, :filename, :filehash, :body_nomarkup)");
		$query->bindValue(':subject', empty($post['subject']) ? null : $post['subject']);
		$query->bindValue(':email', empty($post['email']) ? null : $post['email']);
		$query->bindValue(':trip', empty($post['trip']) ? null : $post['trip']);
		$query->bindValue(':capcode', empty($post['capcode']) ? null : $post['capcode']);
		$query->bindValue(':name', $post['name']);
		$query->bindValue(':body_nomarkup', $post['body_nomarkup']);
		$query->bindValue(':filename', isset($post['filename']) ? $post['filename'] : null);
		$query->bindValue(':filehash', isset($post['filehash']) ? $post['filehash'] : null);
		$query->bindValue(':userhash', $post['userhash']);
		$query->bindValue(':successful_post_id', isset($post['id']) ? $post['id'] : null);
		$query->bindValue(':thread', $post['thread']);
		$query->bindValue(':board', $board['uri']);
		$query->bindValue(':ip', $post['ip']);
		$query->bindValue(':ip_type', ipType($post['ip']));
		$query->bindValue(':blocked', $blocked);
		$query->bindValue(':filter_id', $filter_id);
		if (!$query->execute()) {
			$err = $query->errorInfo();

			// If we get the following error, it's because the filter was removed by
			// the time we applied it. Probably just because the filter cache was
			// outdated. Log it, dump the cache, and move on.
			//  Cannot add or update a child row: a foreign key constraint fails (`tinyboard`.`post_filter_hits`, CONSTRAINT `post_filter_hits_ibfk_1` FOREIGN KEY (`filter_id`) REFERENCES `post_filters` (`id`) ON DELETE SET NULL)
			if (
				$err[0] === '23000' &&
				strpos($err[2], 'FOREIGN KEY (`filter_id`) REFERENCES `post_filters`') !== false
			) {
				error_log("Tried to insert post filter hit for non-existent filter $filter_id: {$err[2]}");
				if ($config['cache']['enabled']) {
					cache::delete('active_post_filters');
				}
			} else {
				error($err[2]);
			}
		}
	};

	if ($blocked) {
		$do_insert($post);
	} else {
		event_handler('post-after', $do_insert);
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

function postMatchesConditions(array $conditions, array $post) {
	foreach($conditions as $condition) {
		if (!postMatchesCondition($condition, $post)) {
			return false;
		}
	}
	return true;
}

function postMatchesCondition($condition, array $post) {
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
		// case 'ip':
		// TODO should be a CIDR/glob range instead
		// 	return preg_match($condition['value'], $_SERVER['REMOTE_ADDR']);
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
