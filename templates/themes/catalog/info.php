<?php
	$theme = array();
	
	// Theme name
	$theme['name'] = 'Catalog';
	// Description (you can use Tinyboard markup here)
	$theme['description'] = 'Show a post catalog.';
	$theme['version'] = 'v0.1';
	
	// Theme configuration	
	$theme['config'] = Array();

	$theme['config'][] = Array(
		'title' => 'Thumbnail max width',
		'name' => 'thumb_width',
		'type' => 'text',
		'default' => '150',
		'comment' => ''
	);
	
	$theme['config'][] = Array(
		'title' => 'Thumbnail max height',
		'name' => 'thumb_height',
		'type' => 'text',
		'default' => '150',
		'comment' => ''
	);
	
	// Unique function name for building everything
	$theme['build_function'] = 'catalog_build';
	$theme['install_callback'] = 'catalog_install';

	if (!function_exists('catalog_install')) {
		function catalog_install($settings) {
			if (!is_numeric($settings['thumb_width']) || $settings['thumb_width'] < 1)
				return Array(false, '<strong>' . utf8tohtml($settings['thumb_width']) . '</strong> is not a non-negative integer.');
			if (!is_numeric($settings['thumb_height']) || $settings['thumb_height'] < 1)
				return Array(false, '<strong>' . utf8tohtml($settings['thumb_height']) . '</strong> is not a non-negative integer.');
		}
	}
