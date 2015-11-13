<?php
global $config;
if (!isset($_POST['board'], $_POST['password']))
    error($config['error']['bot'], false, 400);

$password = $_POST['password'];

if ($password == '')
    error($config['error']['invalidpassword'], false, 403);

$editposts = array();
foreach ($_POST as $post => $value) {
    if (preg_match('/^delete_(\d+)$/', $post, $m)) {
        $editposts[] = (int)$m[1];
    }
}

checkDNSBL();

// Check if board exists
if (!openBoard($_POST['board']))
    error($config['error']['noboard'], false, 404);

if (!$config['allow_self_edit'])
    error($config['error']['bot'], false, 400);

// Check if banned
checkBan($board['uri']);

if (empty($editposts))
    error($config['error']['noedit'], false, 400);
if (count($editposts)!=1)
    error($config['error']['toomanyedits'], false, 400);

if (isset($_POST['mod']) && $_POST['mod']) {
    require 'inc/mod.php';
    if (!$mod) {
        // Liar. You're not a mod.
        error($config['error']['notamod'], false, 403);
    }
}

$id = $editposts[0];
$query = prepare(sprintf("SELECT `thread`,`time`,`password` FROM `posts_%s` WHERE `id` = :id", $board['uri']));
$query->bindValue(':id', $id, PDO::PARAM_INT);
$query->execute() or error(db_error($query));

$post = $query->fetch();
if(!$post)
    error($config['error']['noedit']);

if (!doesPasswordMatchPostHash($password, $post['password']))
    error($config['error']['invalidpassword'], false, 403);

if ($config['edit_time_end'] !== 0 && time() > $post['time'] + $config['edit_time_end']) {
    error(sprintf($config['error']['edit_too_late'], time_length($config['edit_time_end'])), false, 409);
}

editPostForm($id, $password, $mod);