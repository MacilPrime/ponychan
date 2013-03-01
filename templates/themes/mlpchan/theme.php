<?php
	require 'info.php';
	
	function basic_build($action, $settings) {
		// Possible values for $action:
		//	- all (rebuild everything, initialization)
		//	- news (news has been updated)
		//	- boards (board list changed)
		
		tMLPchan::build($action, $settings);
	}
	
	// Wrap functions in a class so they don't interfere with normal Tinyboard operations
	class tMLPchan {
		public static function build($action, $settings) {
			global $config;
			
			if ($action == 'all' || $action == 'news')
				file_write($config['dir']['home'] . $settings['file'], tMLPchan::homepage($settings));
		}
		
		// Build news page
		public static function homepage($settings) {
			global $config;
			
			$settings['no_recent'] = (int) $settings['no_recent'];
			
			$query = prepare("SELECT * FROM `news` ORDER BY `time` DESC" . ($settings['no_recent'] >= 0 ? ' LIMIT :norecent' : ''));
			$query->bindValue(':norecent', $settings['no_recent'], PDO::PARAM_INT);
			$query->execute() or error(db_error($query));
			$news = $query->fetchAll(PDO::FETCH_ASSOC);
			
			$categories = $config['categories'];

			foreach ($categories as &$boards) {
				foreach ($boards as &$board) {
					$info = getBoardInfo($board);
					$title = $info ? $info['title'] : $board;
					$subtitle = $info ? $info['subtitle'] : 'Unknown';
					$board = Array('title' => $title, 'shortname' => $board, 'subtitle' => $subtitle, 'uri' => sprintf($config['board_path'], $board));
				}
			}


			return Element('themes/mlpchan/index.html', Array(
				'settings' => $settings,
				'config' => $config,
				'categories' => $categories,
				'boardlist' => createBoardlist(),
				'news' => $news
			));
		}
	};
	
?>
