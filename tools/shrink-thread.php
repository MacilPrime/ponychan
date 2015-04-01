<?php

$site_dir = '/var/www/mcweb/mlpchan/';

chdir($site_dir);
require 'inc/functions.php';

//$bn = 'space';
//$thread = 154;
$bn = 'chat';
$thread = 1129651;

$count = 5000;

if (!openBoard($bn))
	error($config['error']['noboard']);

$query = prepare(sprintf("SELECT `id` FROM `posts_%s` WHERE `thread` = :thread ORDER BY `id` LIMIT :count", $bn));
$query->bindValue(':thread', $thread, PDO::PARAM_INT);
$query->bindValue(':count', $count, PDO::PARAM_INT);
$query->execute() or error(db_error($query));

header('Content-Type: text/plain');

$ids = array();

while ($post = $query->fetch()) {
	echo 'Selecting ' . $post['id'] . "...\n";
	$ids[] = (int)$post['id'];
}
echo "Deleting...\n";
deletePosts($ids);
echo "Done.\n";
