<?php

$site_dir = '/home/mlpchan/www/';

chdir($site_dir);
require 'inc/functions.php';

		set_time_limit($config['mod']['rebuild_timelimit']);

		$boards = listBoards();
		$rebuilt_scripts = array();
		
		if (true || isset($_POST['rebuild_cache'])) {
			if ($config['cache']['enabled']) {
				echo "Flushing cache\n";
				Cache::flush();
			}
			
			echo "Clearing template cache\n";
			load_twig();
			$twig->clearCacheFiles();
		}
		
		if (true || isset($_POST['rebuild_javascript'])) {
			echo 'Rebuilding ' . $config['file_instance_script'] . "\n";
			buildJavascript();
			$rebuilt_scripts[] = $config['file_instance_script'];
		}
		
		if (true || isset($_POST['rebuild_themes'])) {
			echo "Regenerating theme files\n";
			rebuildThemes('all');
		}
		
		foreach ($boards as $_board) {
			openBoard($_board['uri']);
			
			if (true || isset($_POST['rebuild_index'])) {
				buildIndex();
				echo sprintf($config['board_abbreviation'], $board['uri']) . ": Creating index pages\n";
			}
			
			if ((true || isset($_POST['rebuild_javascript'])) && !in_array($config['file_instance_script'], $rebuilt_scripts)) {
				echo sprintf($config['board_abbreviation'], $board['uri']) . ': Rebuilding ' . $config['file_instance_script'] . "\n";
				buildJavascript();
				$rebuilt_scripts[] = $config['file_instance_script'];
			}
			
			if (true || isset($_POST['rebuild_thread'])) {
				$query = query(sprintf("SELECT `id` FROM `posts_%s` WHERE `thread` IS NULL", $board['uri'])) or error(db_error());
				while ($post = $query->fetch(PDO::FETCH_ASSOC)) {
					//if (rand(1,5) == 1) sleep(1);
					echo sprintf($config['board_abbreviation'], $board['uri']) . ': Rebuilding thread #' . $post['id'] . "\n";
					flush();
					buildThread($post['id']);
				}
			}
		}

		echo "Finished successfully.\n";
