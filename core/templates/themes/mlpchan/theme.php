<?php
	require 'info.php';

	function mlpchan_build($action, $settings, $board) {
		// Possible values for $action:
		//	- all (rebuild everything, initialization)
		//	- news (news has been updated)
		//	- boards (board list changed)
		//	- post-thread (a thread has been made)
		//	- post-reply (a reply has been made)
		//	- post (possibly a combination of threads and replies and deletions)

		$t = new tMLPchan();
		$t->build($action, $settings);
	}

	// Wrap functions in a class so they don't interfere with normal Tinyboard operations
	class tMLPchan {
		public function build($action, $settings) {
			global $config;

			$this->excluded = explode(' ', $settings['exclude']);

			if ($action == 'all' || $action == 'boards' || $action == 'news' || $action == 'post-reply' || $action == 'post')
				file_write($config['dir']['home'] . $settings['file'], tMLPchan::homepage($settings));

			if ($action == 'all')
				file_write($config['dir']['home'] . 'settings.html', tMLPchan::settingspage($settings));
		}

		// Build news page
		public function homepage($settings) {
			global $config, $board;
			$oldboarduri = $board['uri'];

			$settings['no_recent'] = (int) $settings['no_recent'];

			$query = prepare("SELECT * FROM `news` ORDER BY `time` DESC" . ($settings['no_recent'] >= 0 ? ' LIMIT :norecent' : ''));
			$query->bindValue(':norecent', $settings['no_recent'], PDO::PARAM_INT);
			$query->execute() or error(db_error($query));
			$news = $query->fetchAll(PDO::FETCH_ASSOC);

			$categories = $config['categories'];

			foreach ($categories as &$boards) {
				foreach ($boards as &$_board) {
					$info = getBoardInfo($_board);
					$title = $info ? $info['title'] : $_board;
					$subtitle = $info ? $info['subtitle'] : 'Unknown';
					$_board = Array('title' => $title, 'shortname' => $_board, 'subtitle' => $subtitle, 'uri' => sprintf($config['board_path'], $_board));
				}
			}
			unset($boards);

			$recent_posts = Array();
			if ($settings['limit_posts'] > 0) {
				$boards = listBoards();
				$sql = '';
				$l = (int) $settings['limit_posts']; // Stupid PDO doesn't want to work any other way.
				foreach ($boards as &$_board) {
					if (in_array($_board['uri'], $this->excluded))
						continue;
					// Apparently MySQL is too dumb to optimize through all of the unions, so
					// each of the substatements has the order by limit stuff in it too.
					// Well, ideally there should just be one posts table.
					$sql .= sprintf("SELECT * FROM (SELECT *, '%s' AS `board` FROM `posts_%s` WHERE `thread` IS NOT NULL AND `file` IS NOT NULL AND `file` != 'deleted' AND `thumb` != 'spoiler' AND `mature` = 0 ORDER BY `time` DESC LIMIT ${l}) AS `temp_%s` UNION ALL ", $_board['uri'], $_board['uri'], $_board['uri']);
				}
				$sql = preg_replace('/UNION ALL $/', "ORDER BY `time` DESC LIMIT ${l}", $sql);
				$query = prepare($sql);
				$query->execute() or error(db_error($query));

				while ($post = $query->fetch(PDO::FETCH_ASSOC)) {
					openBoard($post['board']);

					// board settings won't be available in the template file, so generate links now
					$post['link'] = $config['root'] . $board['dir'] . $config['dir']['res'] . sprintf($config['file_page'], ($post['thread'] ? $post['thread'] : $post['id'])) . '#' . $post['id'];
					$post['boardlink'] = sprintf($config['board_path'], $post['board']);
					$post['snippet'] = pm_snippet($post['body'], 80);
					$post['src'] = $config['uri_thumb'] . $post['thumb'];

					$recent_posts[] = $post;
				}
			}

			openBoard($oldboarduri);

			return Element('themes/mlpchan/index.html', Array(
				'settings' => $settings,
				'config' => $config,
				'categories' => $categories,
				'boardlist' => createBoardlist(false, true),
				'recent_posts' => $recent_posts,
				'news' => $news
			));
		}

		// Build settings page
		public function settingspage($settings) {
			global $config;

			return Element('themes/mlpchan/settings.html', Array(
				'settings' => $settings,
				'config' => $config,
				'boardlist' => createBoardlist(false, true)
			));
		}
	};
