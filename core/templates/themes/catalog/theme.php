<?php
	require 'info.php';

	function catalog_build($action, $settings, $board_name) {
		global $config, $board;

		// Possible values for $action:
		//	- all (rebuild everything, initialization)
		//	- news (news has been updated)
		//	- boards (board list changed)
		//	- post-thread (a thread has been made)
		//	- post-reply (a reply has been made)
		//	- post (possibly a combination of threads and replies and deletions)

		if ($action != 'all' && $action != 'post-thread' && $action != 'post') return;

		$b = new Catalog();

		if (!$board_name) {
			$oldboarduri = $board['uri'];

			$boards = listBoards();

			foreach ($boards as $_board) {
				openBoard($_board['uri']);
				$b->build($settings);
			}

			openBoard($oldboarduri);
		} else {
			$b->build($settings);
		}
	}

	// Wrap functions in a class so they don't interfere with normal Tinyboard operations
	class Catalog {
		public function build($settings) {
			global $config, $board;

			$query = query(sprintf("SELECT *, INET6_NTOA(`ip_data`) AS `ip`, `id` AS `thread_id`, (SELECT COUNT(*) FROM `posts_%s` WHERE `thread` = `thread_id`) AS `reply_count` FROM `posts_%s` WHERE `thread` IS NULL ORDER BY `bump` DESC", $board['uri'], $board['uri'])) or error(db_error());

			$threads = array();

			while($post = $query->fetch(PDO::FETCH_ASSOC)) {
				if ($post['thumbwidth'] !== null) {
					$newRes = computeResize($post['thumbwidth'], $post['thumbheight'], $settings['thumb_width'], $settings['thumb_height']);
					$post['thumbwidth'] = $newRes['width'];
					$post['thumbheight'] = $newRes['height'];
				}
				$thread = new Thread(
					$post['id'], $post['subject'], $post['email'], $post['email_protocol'], $post['name'], $post['trip'], $post['capcode'], $post['body'], $post['time'],
					$post['thumb'], $post['thumb_uri'], $post['thumbwidth'], $post['thumbheight'], $post['file'], $post['file_uri'], $post['filewidth'], $post['fileheight'], $post['filesize'],
					$post['filename'], $post['ip'], $post['sticky'], $post['locked'], $post['sage'], $post['embed'], $config['root'], false, false, $post['mature']
				);
				$thread->omitted = $thread->reply_count = $post['reply_count'];
				$threads[] = $thread;
			}

			file_write($board['dir'] . 'catalog.html', Element('themes/catalog/catalog.html', Array(
				'config' => $config,
				'boardlist' => createBoardlist(),
				'threads' => $threads,
				'board' => $board
			)));

		}
	};
