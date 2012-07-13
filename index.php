<?php

require_once 'inc/functions.php';

$boards = array();

foreach ($config['categories'] as &$category) {
	foreach ($category as $key => $boarduri) {
		if (is_array($boarduri)) {
			$boards[$key] = array(
				'link' => $boarduri[0],
				'title' => $boarduri[1],
				'subtitle' => $boarduri[2],
			);
		} else {
			openBoard($boarduri);
			$boards[$boarduri] = $board;
		}
	}
}

unset($board);

$body = Element('homepage.html', array(
      	'config' => $config,
	'boards' => $boards,
	'boardlist' => createBoardlist($mod),
	));

print $body;
