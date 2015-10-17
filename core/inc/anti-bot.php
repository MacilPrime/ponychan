<?php

/*
 *  Copyright (c) 2010-2013 Tinyboard Development Group
 */

if (realpath($_SERVER['SCRIPT_FILENAME']) == str_replace('\\', '/', __FILE__)) {
	// You cannot request this file directly.
	exit;
}

class AntiBot {
	public $salt, $inputs = array(), $index = 0;
	private $hasLogged = false;

	public static function randomString($length, $uppercase = false, $special_chars = false) {
		$chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
		if ($uppercase)
			$chars .= 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		if ($special_chars)
			$chars .= ' ~!@#$%^&*()_+,./;\'[]\\{}|:<>?=-` ';

		$chars = str_split($chars);

		$ch = array();

		// fill up $ch until we reach $length
		while (count($ch) < $length) {
			$n = $length - count($ch);
			$keys = array_rand($chars, $n > count($chars) ? count($chars) : $n);
			if ($n == 1) {
				$ch[] = $chars[$keys];
				break;
			}
			shuffle($keys);
			foreach ($keys as $key)
				$ch[] = $chars[$key];
		}

		$chars = $ch;

		return implode('', $chars);
	}

	public static function make_confusing($string) {
		$chars = str_split($string);

		foreach ($chars as &$c) {
			if (rand(0, 2) != 0)
				$c = utf8tohtml($c);
			else
				$c = mb_encode_numericentity($c, array(0, 0xffff, 0, 0xffff), 'UTF-8');
		}

		return implode('', $chars);
	}

	public function __construct(array $salt = array()) {
		global $config;

		if (!empty($salt)) {
			// create a salted hash of the "extra salt"
			$this->salt = implode(':', $salt);
		} else {
			$this->salt = '';
		}

		shuffle($config['spam']['hidden_input_names']);

		$input_count = rand($config['spam']['hidden_inputs_min'], $config['spam']['hidden_inputs_max']);
		$hidden_input_names_x = 0;

		for ($x = 0; $x < $input_count ; $x++) {
			if ($hidden_input_names_x === false || rand(0, 2) == 0) {
				// Use an obscure name
				$name = $this->randomString(rand(10, 40));
			} else {
				// Use a pre-defined confusing name
				$name = $config['spam']['hidden_input_names'][$hidden_input_names_x++];
				if ($hidden_input_names_x >= count($config['spam']['hidden_input_names']))
					$hidden_input_names_x = false;
			}

			if (rand(0, 2) == 0) {
				// Value must be null
				$this->inputs[$name] = '';
			} elseif (rand(0, 4) == 0) {
				// Numeric value
				$this->inputs[$name] = (string)rand(0, 100);
			} else {
				// Obscure value
				$this->inputs[$name] = $this->randomString(rand(5, 100), true, true);
			}
		}
	}

	public function html($count = false) {
		global $config;

		$elements = array(
			'<input type="hidden" name="%name%" value="%value%">',
			'<input type="hidden" value="%value%" name="%name%">',
			'<input style="display:none" type="text" name="%name%" autocomplete="off" value="%value%">',
			'<input style="display:none" autocomplete="off" type="text" value="%value%" name="%name%">',
			'<span style="display:none"><input type="text" name="%name%" value="%value%" autocomplete="off"></span>',
			'<div style="display:none"><input type="text" name="%name%" autocomplete="off" value="%value%"></div>',
			'<div style="display:none"><input autocomplete="off" type="text" name="%name%" value="%value%"></div>',
			'<textarea autocomplete="off" style="display:none" name="%name%">%value%</textarea>',
			'<textarea name="%name%" autocomplete="off" style="display:none">%value%</textarea>'
		);

		$html = '';

		if ($count === false) {
			$count = rand(1, count($this->inputs) / 15);
		}

		if ($count === true) {
			// all elements
			$inputs = array_slice($this->inputs, $this->index);
		} else {
			$inputs = array_slice($this->inputs, $this->index, $count);
		}
		$this->index += count($inputs);

		foreach ($inputs as $name => $value) {
			$element = false;
			while (!$element) {
				$element = $elements[array_rand($elements)];
				if (strpos($element, 'textarea') !== false && $value == '') {
					// There have been some issues with mobile web browsers and empty <textarea>'s.
					$element = false;
				}
			}

			$element = str_replace('%name%', utf8tohtml($name), $element);

			if (rand(0, 2) == 0)
				$value = $this->make_confusing($value);
			else
				$value = utf8tohtml($value);

			if (strpos($element, 'textarea') === false)
				$value = str_replace('"', '&quot;', $value);

			$element = str_replace('%value%', $value, $element);

			$html .= $element;
		}

		return $html;
	}

	public function reset() {
		$this->index = 0;
	}

	public function hash() {
		global $config;

		// This is the tricky part: create a hash to validate it after
		// First, sort the keys in alphabetical order (A-Z)
		$inputs = $this->inputs;
		ksort($inputs);

		$hash = '';
		// Iterate through each input
		foreach ($inputs as $name => $value) {
			$hash .= $name . '=' . $value;
		}
		// Add a salt to the hash
		$hash .= $config['cookies']['salt'];

		// Use SHA1 for the hash
		$hash = sha1($hash . $this->salt);

		if (!$this->hasLogged && isset($config['antibot_log'])) {
			$logdata = array();
			$logdata['time'] = date(DATE_ATOM);
			$logdata['action'] = 'hash_made';

			$logdata['inputs'] = $inputs;
			$logdata['hash'] = $hash;

			$logline = json_encode($logdata);
			logToFile($config['antibot_log'], $logline);

			$this->hasLogged = true;
		}

		return $hash;
	}
}

function _create_antibot($board, $thread) {
	return new AntiBot(array($board, $thread));
}

function checkSpam(array $extra_salt = array()) {
	global $config;

	if (!isset($_POST['hash']))
		return true;

	$hash_given = $_POST['hash'];

	if (!empty($extra_salt)) {
		// create a salted hash of the "extra salt"
		$extra_salt = implode(':', $extra_salt);
	} else {
		$extra_salt = '';
	}

	// Reconsturct the $inputs array
	$inputs = array();

	foreach ($_POST as $name => $value) {
		if (in_array($name, $config['spam']['valid_inputs']))
			continue;

		$inputs[$name] = $value;
	}

	// Sort the inputs in alphabetical order (A-Z)
	ksort($inputs);

	$hash_expected = '';

	// Iterate through each input
	foreach ($inputs as $name => $value) {
		$hash_expected .= $name . '=' . $value;
	}

	// Add a salt to the hash
	$hash_expected .= $config['cookies']['salt'];

	// Use SHA1 for the hash
	$hash_expected = sha1($hash_expected . $extra_salt);

	if ($hash_given !== $hash_expected) {
		if (isset($config['antibot_log'])) {
			global $userhash;
			$logdata = array();
			$logdata['userhash'] = $userhash;
			$logdata['referrer'] = $_SERVER['HTTP_REFERER'];
			$logdata['time'] = date(DATE_ATOM);
			$logdata['ip'] = $_SERVER['REMOTE_ADDR'];
			$logdata['user_agent'] = $_SERVER['HTTP_USER_AGENT'];
			$logdata['action'] = 'hash_failure';

			$logdata['inputs_given'] = $inputs;
			$logdata['hash_expected'] = $hash_expected;
			$logdata['hash_given'] = $hash_given;

			$logline = json_encode($logdata);
			logToFile($config['antibot_log'], $logline);
		}

		return true;
	}

	return false;
}
