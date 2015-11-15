<?php

  // Some extra default config stuff for vagrant instances

  $config['cache']['enabled'] = 'redis';
  $config['cache']['redis'] = array('localhost', 6379, '', 1);

  $config['overrides']['cookies']['salt'] = 'test value';

  $config['thumb_ext'] = '';
  $config['thumb_method'] = 'convert';

  $config['spoiler_images'] = true;
  $config['show_spoiler_thread_button'] = true;
  $config['mature_allowed'] = true;

  /*
   * For lack of a better name, “boardlinks” are those sets of navigational links that appear at the top
   * and bottom of board pages. They can be a list of links to boards and/or other pages such as status
   * blogs and social network profiles/pages.
   *
   * "Groups" in the boardlinks are marked with square brackets. Tinyboard allows for infinite recursion
   * with groups. Each array() in $config['boards'] represents a new square bracket group.
   */

  $config['boards'] = array(
    array('home' => '/'), array('b'), array('pone', 'cool')
  );

  // Show "Catalog" link in page navigation. Use with the Catalog theme.
  // $config['catalog_link'] = 'catalog.html';

  // Board categories. Only used in the "Categories" theme.
  // $config['categories'] = array(
  //   'Group Name' => array('a', 'b', 'c'),
  //   'Another Group' => array('d')
  // );
  // Optional for the Categories theme. This is an array of name => (title, url) groups for categories
  // with non-board links.
  // $config['custom_categories'] = array(
  //   'Links' => array(
  //     'Tinyboard' => 'http://tinyboard.org',
  //     'Donate' => 'donate.html'
  //   )
  // );

  $LOGDIR = '/var/www/logs';
  if (!file_exists($LOGDIR)) {
    mkdir($LOGDIR, 0755, true);
  }

  $config['action_log'] = $LOGDIR . '/action.log';
  //$config['antibot_log'] = $LOGDIR . '/antibot.log';
  //$config['timing_log'] = $LOGDIR . '/timing.log';
  $config['error_log'] = $LOGDIR . '/error.log';
  $config['js_usage_log'] = $LOGDIR . '/js_usage.log';
  $config['js_error_log'] = $LOGDIR . '/js_error.log';
  $config['js_misc_log'] = $LOGDIR . '/js_misc.log';
