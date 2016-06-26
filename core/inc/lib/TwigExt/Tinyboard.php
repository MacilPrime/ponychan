<?php

class TwigExt_Tinyboard extends Twig_Extension
{
	/**
	* Returns a list of filters to add to the existing list.
	*
	* @return array An array of filters
	*/
	public function getFilters()
	{
		return Array(
			new Twig_SimpleFilter('filesize', 'format_bytes'),
			new Twig_SimpleFilter('truncate', 'twig_truncate_filter'),
			new Twig_SimpleFilter('truncate_body', 'truncate'),
			new Twig_SimpleFilter('extension', 'twig_extension_filter'),
			new Twig_SimpleFilter('sprintf', 'sprintf'),
			new Twig_SimpleFilter('capcode', 'capcode'),
			new Twig_SimpleFilter('hasPermission', 'twig_hasPermission_filter'),
			new Twig_SimpleFilter('date', 'twig_date_filter'),
			new Twig_SimpleFilter('poster_id', 'poster_id'),
			new Twig_SimpleFilter('remove_whitespace', 'twig_remove_whitespace_filter', ['pre_escape' => 'html', 'is_safe' => ['html']]),
			new Twig_SimpleFilter('count', 'count'),
			new Twig_SimpleFilter('ago', 'ago'),
			new Twig_SimpleFilter('until', 'until'),
			new Twig_SimpleFilter('time_length', 'time_length'),
			new Twig_SimpleFilter('push', 'twig_push_filter'),
			new Twig_SimpleFilter('filemtime', 'filemtime'),
			new Twig_SimpleFilter('bidi_cleanup', 'bidi_cleanup'),
			new Twig_SimpleFilter('addslashes', 'addslashes'),
			new Twig_SimpleFilter('ipToUserRange', 'ipToUserRange'),
			new Twig_SimpleFilter('mask', 'render_mask'),
			new Twig_SimpleFilter('mask_url', 'mask_url'),
			new Twig_SimpleFilter('ban_type_name', 'ban_type_name')
		);
	}

	/**
	* Returns a list of functions to add to the existing list.
	*
	* @return array An array of filters
	*/
	public function getFunctions()
	{
		return Array(
			new Twig_SimpleFunction('getBoardConfig', 'getBoardConfig'),
			new Twig_SimpleFunction('time', 'time'),
			new Twig_SimpleFunction('floor', 'floor'),
			new Twig_SimpleFunction('timezone', 'twig_timezone_function'),
		);
	}

	/**
	* Returns the name of the extension.
	*
	* @return string The extension name
	*/
	public function getName()
	{
		return 'tinyboard';
	}
}

function twig_timezone_function() {
	return 'Z';
}

function twig_push_filter($array, $value) {
	array_push($array, $value);
	return $array;
}

function twig_remove_whitespace_filter($data) {
	return preg_replace('/[\t\r\n]/', '', $data);
}

function twig_date_filter($date, $format) {
	return gmstrftime($format, $date);
}

function twig_hasPermission_filter($mod, $permission, $board = null) {
	return hasPermission($permission, $board, $mod);
}

function twig_extension_filter($value, $case_insensitive = true) {
	$ext = substr($value, strrpos($value, '.') + 1);
	if($case_insensitive)
		$ext = strtolower($ext);
	return $ext;
}

function twig_sprintf_filter( $value, $var) {
	return sprintf($value, $var);
}

function twig_truncate_filter($value, $length = 30, $preserve = false, $separator = '…') {
	if (mb_strlen($value) > $length) {
		if ($preserve) {
			if (false !== ($breakpoint = mb_strpos($value, ' ', $length))) {
				$length = $breakpoint;
			}
		}
		return mb_substr($value, 0, $length) . $separator;
	}
	return $value;
}
