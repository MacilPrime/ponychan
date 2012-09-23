<?php

require 'inc/functions.php';

// Fix for magic quotes
if (get_magic_quotes_gpc()) {
	function strip_array($var) {
		return is_array($var) ? array_map('strip_array', $var) : stripslashes($var);
	}
	
	$_GET = strip_array($_GET);
	$_POST = strip_array($_POST);
}

header('Content-type: text/plain');

if (!isset($_POST['userid'], $_POST['type'], $_POST['data']))
	die("Error: Missing arguments");

$userid = $_POST['userid'];
$type = $_POST['type'];
$data = json_decode($_POST['data']);

if ($type !== 'error')
	die("Error: Invalid type");
if (!preg_match('/^[0-9a-f]{16}$/', $userid))
	die("Error: userid is formatted incorrectly");
if ($data === NULL)
	die("Error: Could not interpret JSON data");
if (gettype($data) !== 'object')
	die("Error: Incorrect JSON data");
if (!isset($data->message))
	die("Error: JSON data missing a message");

if (!isset($config['js_error_log']))
	die("Error: Server not configured for logging");

$output_line = $_SERVER['REMOTE_ADDR'] . ' [' . date(DATE_ATOM) . '] ' . $userid . ' ' . json_encode($data) . ' "' . addslashes($_SERVER['HTTP_USER_AGENT']) . '"' . "\n";

$fd = fopen($config['js_error_log'], 'at');
if (!$fd)
	die("Error: Server logging failed");
fwrite($fd, $output_line);
fclose($fd);

echo "Good";
