<?php

$site_dir = '/var/www/mcweb/mlpchan/';

chdir($site_dir);
require 'inc/functions.php';
require 'inc/mod/auth.php';
require 'inc/mod/pages.php';

$mod = array(
	'type' => ADMIN,
	'boards' => array('*'),
	'id' => 9001,
	'username' => 'script'
	);

function move_threads($origBoard, $destBoard) {
	$query = prepare(sprintf("SELECT `id` FROM `posts_%s` WHERE `thread` IS NULL AND `sticky` = 0", $origBoard));
	$query->execute() or error(db_error($query));
	
	$_POST['shadow'] = 1;
	$_POST['board'] = $destBoard;
	while ($post = $query->fetch()) {
		echo 'Moving /' . $origBoard . '/' . $post['id'] . " to /' . $destBoard . '/ ...\n";
		
		mod_move($origBoard, (int)$post['id']);
	}
}

move_threads('chat', 'oat');
