<?php
global $config;
if (!isset($_POST['board'], $_POST['id']))
    error($config['error']['bot'], false, 400);

$id = $_POST['id'];

checkDNSBL();

// Check if board exists
if (!openBoard($_POST['board']))
    error($config['error']['noboard']);

// Check if banned
checkBan($board['uri']);

$query = prepare(sprintf("SELECT `name`,`trip`,`email`,`subject`,`filename`,`userhash`,`thread`,`time`,`password`,`file`,`embed` FROM `posts_%s` WHERE `id` = :id", $board['uri']));
$query->bindValue(':id', $id, PDO::PARAM_INT);
$query->execute() or error(db_error($query));

$post = $query->fetch();
if(!$post)
    error($config['error']['noedit']);

if (isset($_POST['password']))
    $password = $_POST['password'];

if (isset($password) && !$config['allow_self_edit'])
    error($config['error']['bot']);

if (isset($_POST['mod']) && $_POST['mod']) {
    require 'inc/mod.php';
    if (!$mod) {
        // Liar. You're not a mod.
        error($config['error']['notamod'], false, 403);
    }

    $post['raw'] = isset($_POST['raw']);
    $post['noeditmsg'] = isset($_POST['noeditmsg']);

    if (!isset($password) && !hasPermission('editpost', $board['uri']))
        error($config['error']['noaccess']);
    if ($post['raw'] && !hasPermission('rawhtml', $board['uri']))
        error($config['error']['noaccess']);
    if ($post['noeditmsg'] && !hasPermission('noeditmsg', $board['uri']))
        error($config['error']['noaccess']);
} else {
    if (!isset($password))
        error($config['error']['bot']);

    if ($config['edit_time_end'] !== 0 && time() > $post['time'] + $config['edit_time_end']) {
        error(sprintf($config['error']['edit_too_late'], time_length($config['edit_time_end'])), false, 409);
    }
}

if (isset($password)) {
    if (!doesPasswordMatchPostHash($password, $post['password']))
        error($config['error']['invalidpassword'], false, 403);
}

// Check the referrer
if (!isset($_SERVER['HTTP_REFERER']) || !preg_match($config['referer_match'], $_SERVER['HTTP_REFERER']))
    error($config['error']['referer']);

$post['board'] = $_POST['board'];
$post['ip'] = $_SERVER['REMOTE_ADDR'];
$post['op'] = !$post['thread'];
$post['body'] = $_POST['body'];
$post['anon_thread'] = ($post['op'] && (stripos($post['body'], '[#anon]') !== false));

if (!($post['file'] || isset($post['embed'])) || (($post['op'] && $config['force_body_op']) || (!$post['op'] && $config['force_body']))) {
    $stripped_whitespace = preg_replace('/[\s]/u', '', $post['body']);
    if ($stripped_whitespace == '') {
        error($config['error']['tooshort_body'], false, 400);
    }
}

if (!$mod && mb_strlen($post['body']) > $config['max_body'])
    error($config['error']['toolong_body'], false, 400);

wordfilters($post['body']);

$post['body_nomarkup'] = $post['body'];

if (!($mod && isset($post['raw']) && $post['raw']))
    $post['tracked_cites'] = markup($post['body'], true, !$mod);

require_once 'inc/filters.php';

do_filters($post);

if (!($mod && isset($post['noeditmsg']) && $post['noeditmsg'])) {
    $now = new DateTime();
    $nowStr = $now->format(DateTime::W3C);
    $time = '<time datetime="'.$nowStr.'">'.$nowStr.'</time>';
    $post['body'] .= "\n" . sprintf(isset($password) ? $config['edit_self_message'] : $config['edit_mod_message'], $time);
}

$post = (object)$post;
if ($error = event('post-edit', $post)) {
    error($error);
}
$post = (array)$post;

$query = prepare(sprintf("UPDATE `posts_%s` SET `body` = :body, `body_nomarkup` = :body_nomarkup, `anon_thread` = :anon_thread WHERE `id` = :id", $board['uri']));
$query->bindValue(':id', $id, PDO::PARAM_INT);
$query->bindValue(':body', $post['body'], PDO::PARAM_STR);
$query->bindValue(':body_nomarkup', $post['body_nomarkup'], PDO::PARAM_STR);
$query->bindValue(':anon_thread', $post['anon_thread'] ? 1 : 0, PDO::PARAM_INT);
$query->execute() or error(db_error($query));

$query = prepare("DELETE FROM `cites` WHERE `board` = :board AND `post` = :id");
$query->bindValue(':board', $board['uri']);
$query->bindValue(':id', $id, PDO::PARAM_INT);
$query->execute() or error(db_error($query));

if (isset($post['tracked_cites'])) {
    foreach ($post['tracked_cites'] as $cite) {
        $query = prepare('INSERT INTO `cites` (`board`, `post`, `target_board`, `target`) VALUES(:board, :post, :target_board, :target)');
        $query->bindValue(':board', $board['uri']);
        $query->bindValue(':post', $id, PDO::PARAM_INT);
        $query->bindValue(':target_board',$cite[0]);
        $query->bindValue(':target', $cite[1], PDO::PARAM_INT);
        $query->execute() or error(db_error($query));
    }
}

buildThread($post['op'] ? $id : $post['thread']);

buildIndex();

if ($config['syslog'])
    _syslog(LOG_INFO, 'Edited post: /' . $board['dir'] . $config['dir']['res'] .
        sprintf($config['file_page'], $post['op'] ? $id : $post['thread']) . (!$post['op'] ? '#' . $id : ''));

if (isset($config['action_log'])) {
    $logdata = array();
    $logdata['userhash'] = $userhash;
    $logdata['action'] = 'editpost';
    $logdata['board'] = $board['uri'];
    $logdata['number'] = intval($id);
    $logdata['body_nomarkup'] = $post['body_nomarkup'];
    $logdata['byauthor'] = isset($password);
    $logdata['time'] = date(DATE_ATOM);
    $logdata['thread'] = $post['op'] ? null : intval($post['thread']);
    $logdata['ip'] = $post['ip'];
    $logdata['commentsimplehash'] = simplifiedHash($post['body_nomarkup']);
    $logline = json_encode($logdata);
    logToFile($config['action_log'], $logline);
}

rebuildThemes('post');

$is_mod = isset($_POST['mod']) && $_POST['mod'];
$root = $is_mod ? $config['root'] . $config['file_mod'] . '?/' : $config['root'];

header('Location: ' . $root . $board['dir'], true, $config['redirect_http']);
