<?php
global $config;
if (!isset($_POST['board'], $_POST['password'], $_POST['reason']))
    error($config['error']['bot']);

$report = array();
foreach ($_POST as $post => $value) {
    if (preg_match('/^delete_(\d+)$/', $post, $m)) {
        $report[] = (int)$m[1];
    }
}

checkDNSBL();

// Check if board exists
if (!openBoard($_POST['board']))
    error($config['error']['noboard']);

// Check if banned
checkBan($board['uri']);

if (empty($report))
    error($config['error']['noreport']);

if (count($report) > $config['report_limit'])
    error($config['error']['toomanyreports']);

$reason = $_POST['reason'];
markup($reason, false, true);

foreach ($report as $id) {
    $query = prepare(sprintf("SELECT `thread` FROM `posts_%s` WHERE `id` = :id", $board['uri']));
    $query->bindValue(':id', $id, PDO::PARAM_INT);
    $query->execute() or error(db_error($query));

    $post = $query->fetch();

    if ($post) {
        if ($config['syslog'])
            _syslog(LOG_INFO, 'Reported post: ' .
                '/' . $board['dir'] . $config['dir']['res'] . sprintf($config['file_page'], $post['thread'] ? $post['thread'] : $id) . ($post['thread'] ? '#' . $id : '') .
                ' for "' . $reason . '"'
            );
        $query = prepare("INSERT INTO `reports` (`id`, `time`, `ip_type`, `ip_data`, `board`, `post`, `reason`) VALUES (NULL, :time, :ip_type, INET6_ATON(:ip), :board, :post, :reason)");
        $query->bindValue(':time', time(), PDO::PARAM_INT);
        $query->bindValue(':ip', $_SERVER['REMOTE_ADDR'], PDO::PARAM_STR);
        $query->bindValue(':ip_type', ipType($_SERVER['REMOTE_ADDR']));
        $query->bindValue(':board', $board['uri'], PDO::PARAM_INT);
        $query->bindValue(':post', $id, PDO::PARAM_INT);
        $query->bindValue(':reason', $reason, PDO::PARAM_STR);
        $query->execute() or error(db_error($query));
    }
}

$is_mod = isset($_POST['mod']) && $_POST['mod'];
$root = $is_mod ? $config['root'] . $config['file_mod'] . '?/' : $config['root'];

header('Location: ' . $root . $board['dir'], true, $config['redirect_http']);
