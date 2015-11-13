<?php

/*
 *  Copyright (c) 2010-2013 Tinyboard Development Group
 */

require 'inc/functions.php';
require 'inc/anti-bot.php';


header("Cache-Control: no-cache, must-revalidate");

if ($config['readonly_maintenance']) {
	if (isset($_POST['wantjson']) && $_POST['wantjson'])
		$wantjson = true;

	error($config['readonly_maintenance_message']);
}

if (isset($_POST['delete'])) {
	// Delete
	include 'post/delete.php';
} elseif (isset($_POST['edit'])) {
	// User picked a post to edit
	include 'post/edit.php';
} elseif (isset($_POST['editpost'])) {
	// User is submitting an edited post
	include 'post/editpost.php';
} elseif (isset($_POST['report'])) {
	// User reported a post
	include 'post/report.php';
} elseif (isset($_POST['post']) || isset($_POST['making_a_post'])) {
	// User is sending a post
	include 'post/create.php';
} else {
	if (!file_exists($config['has_installed'])) {
		header('Location: install.php', true, $config['redirect_http']);
	} else {
		// They opened post.php in their browser manually.
		error($config['error']['nopost']);
	}
}
