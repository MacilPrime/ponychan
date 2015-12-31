<?php
global $config;
if (!isset($_POST['board'], $_POST['password']))
    error($config['error']['bot'], false, 400);

$password = $_POST['password'];

if ($password == '')
    error($config['error']['invalidpassword'], false, 403);

$delete = array();
foreach ($_POST as $post => $value) {
    if (preg_match('/^delete_(\d+)$/', $post, $m)) {
        $delete[] = (int)$m[1];
    }
}

checkDNSBL();
// Check if board exists
if (!openBoard($_POST['board']))
    error($config['error']['noboard'], false, 404);

// Check if banned
checkBan($board['uri']);

if (empty($delete))
    error($config['error']['nodelete'], false, 400);

foreach ($delete as $id) {
    $query = prepare(sprintf("SELECT `thread`, `time`,`password` FROM `posts_%s` WHERE `id` = :id", $board['uri']));
    $query->bindValue(':id', $id, PDO::PARAM_INT);
    $query->execute() or error(db_error($query));

    if ($post = $query->fetch()) {
        if (!doesPasswordMatchPostHash($password, $post['password']))
            error($config['error']['invalidpassword'], false, 403);

        if ($post['time'] >= time() - $config['delete_time']) {
            error(sprintf($config['error']['delete_too_soon'], until($post['time'] + $config['delete_time'])), false, 409);
        }

        if (isset($_POST['file'])) {
            // Delete just the file
            deleteFile($id);
        } else if ($post['thread'] === null && !$config['op_allow_delete_thread']) {
            // Delete post contents only
            deletePostContent($id);
        } else {
            // Delete entire post
            deletePost($id);
        }

        _syslog(LOG_INFO, 'Deleted post: ' .
            '/' . $board['dir'] . $config['dir']['res'] . sprintf($config['file_page'], $post['thread'] ? $post['thread'] : $id) . ($post['thread'] ? '#' . $id : '')
        );
    }
}

buildIndex();

$is_mod = isset($_POST['mod']) && !!$_POST['mod'];
$root = $is_mod ? $config['root'] . $config['file_mod'] . '?/' : $config['root'];

header('Location: ' . $root . $board['dir'], true, $config['redirect_http']);
