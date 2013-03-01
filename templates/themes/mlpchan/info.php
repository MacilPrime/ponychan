<?php
	$theme = Array();
	
	// Theme name
	$theme['name'] = 'MLPchan';
	// Description (you can use Tinyboard markup here)
	$theme['description'] = 'MLPchan stuff. Enabling boardlinks is recommended for this theme.';
	$theme['version'] = 'v0.1';
	
	// Theme configuration	
	$theme['config'] = Array();
		
	$theme['config'][] = Array(
		'title' => 'Slogan',
		'name' => 'subtitle',
		'type' => 'text',
		'default' => 'Friendship is Magic!',
		'comment' => '(optional)'
	);
	
	$theme['config'][] = Array(
		'title' => 'File',
		'name' => 'file',
		'type' => 'text',
		'default' => $config['file_index'],
		'comment' => '(eg. "index.html")'
	);
	
	$theme['config'][] = Array(
		'title' => '# of news recent entries',
		'name' => 'no_recent',
		'type' => 'text',
		'default' => 0,
		'size' => 3,
		'comment' => '(number of recent news entries to display; "-1" is infinite)'
	);
	
	// Unique function name for building everything
	$theme['build_function'] = 'basic_build';
	$theme['install_callback'] = 'build_install';

	if (!function_exists('build_install')) {
		function build_install($settings) {
			if (!is_numeric($settings['no_recent']) || $settings['no_recent'] < -1)
				return Array(false, '<strong>' . utf8tohtml($settings['no_recent']) . '</strong> is not an integer >= -1.');
		}
	}
