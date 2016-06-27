/*
 * watcher.js
 *
 * Released under the MIT license
 * Copyright (c) 2015 Macil Tech <maciltech@gmail.com>
 *
 */

/* eslint-disable */

import $ from 'jquery';
import RSVP from 'rsvp';
import React from 'react';
import ReactDOM from 'react-dom';
import config from './config';
import { footer } from './footer-utils';
import {log_error} from './logger';
import {make_thread_url, make_thread50_url} from './lib/url';
import {jumpToPost} from './lib/post-utils';
import {get_post_id, get_post_class} from './lib/post-info';
import './settings-screen.js'; // has to come after this
import WatcherMenu from './react/watcher/Menu';

const isModPage = (document.location.pathname == config.site.siteroot+'mod.php');

const max_watched_threads = 70;
const watcher_poll_time = 30 * 1000;

let mod;
let watched_threads;
load_watched_threads();

function shouldShowWatcher() {
  return isModPage || Object.keys(watched_threads).length > 0;
}

function load_watched_threads() {
  if (window.localStorage && localStorage.getItem('watched_threads'))
    watched_threads = JSON.parse(localStorage.getItem('watched_threads'));
  else
    watched_threads = {};
}

function save_watched_threads() {
  localStorage.setItem('watched_threads', JSON.stringify(watched_threads));
}

function add_watch(store, $post) {
  const postid = get_post_id($post);

  if (!watched_threads.hasOwnProperty(postid)) {

    //TODO move
    if (Object.keys(store.getState().watchedThreads).length >= max_watched_threads) {
      alert('Maximum number of threads watched already!');
      return;
    }

    const $intro = $post.find('.intro:first');
    const thread_data = {};
    thread_data.subject = $intro.find('.subject').text();
    thread_data.opname = $intro.find('.name').text();
    thread_data.optrip = $intro.find('.trip').text();
    thread_data.seen_reply_count = null;
    thread_data.known_reply_count = null;
    thread_data.last_seen_time = null;
    thread_data.last_known_time = null;
    thread_data.post = $post.find('.body:first:not(.post-inline-container)').text();
    if (thread_data.post.length > 80) {
      thread_data.post = thread_data.post.slice(0,80)+'…';
    }

    watched_threads[postid] = thread_data;
    save_watched_threads();

    add_watch_buttons($('.'+get_post_class(postid)));
    if ($('.watcherButton').length == 0) {
      init_watcher_menu();
    } else {
      populate_watcher_screen();
      run_watcher_refresher();
    }
  }
}

function remove_watch(postid) {
  load_watched_threads();
  delete watched_threads[postid];
  save_watched_threads();

  let updated = RSVP.Promise.resolve();

  add_watch_buttons($('.'+get_post_class(postid)));
  if (!shouldShowWatcher()) {
    init_watcher_menu();
  } else {
    updated = populate_watcher_screen();
    run_watcher_refresher();
  }
  return updated;
}

function add_watch_buttons($posts) {
  $posts.each(function() {
    const $post = $(this);

    const postid = get_post_id($post);
    if (watched_threads.hasOwnProperty(postid)) {
      footer($post).removeItem('Watch');
      footer($post).addItem('Unwatch', function () {
        remove_watch(postid).then(() => alert('Thread unwatched.'));
      });
    } else {
      footer($post).removeItem('Unwatch');
      footer($post).addItem('Watch', function () {
        add_watch($post);
      });
    }
  });
}

let watcher_query = null;
function refresh_watched_threads(callback) {
  if (watcher_query)
    watcher_query.abort();

  const request_date = new Date();
  watcher_query = $.ajax({
    url: config.site.siteroot+'watcher/threads',
    data: {ids: Object.keys(watched_threads).sort()},
    dataType: 'json',
    success(data) {
      if (data.error) {
        console.log('Watcher error: '+data.error); //eslint-disable-line no-console
        return;
      }
      if (data.scripts) {
        for (let i=0; i<data.scripts.length; i++) {
          try {
            Function(data.scripts[i])();
          } catch (e) {
            log_error(e);
          }
        }
      }
      if (data.threads) {
        load_watched_threads();
        const {threads} = data;
        let changed = false;
        for (let id in threads) {
          if (!watched_threads[id])
            continue;
          // If we've never viewed the thread since watching it, assume we've already
          // seen all of its posts.
          // Only decrease the seen_reply_count value if the latest post seen
          // locally was more than two minutes ago (The server may cache old values for
          // a short amount of time), or if the last reported reply time is more recent
          // than the last seen reply.
          if (
            watched_threads[id].seen_reply_count == null ||
            (watched_threads[id].seen_reply_count > threads[id].reply_count &&
             threads[id].reply_count != null &&
             (watched_threads[id].last_seen_time + 2*60 < request_date.getTime()/1000 ||
              watched_threads[id].last_seen_time < threads[id].last_reply_time))
          ) {
            watched_threads[id].seen_reply_count = threads[id].reply_count;
            changed = true;
          }
          if (watched_threads[id].last_seen_time == null) {
            watched_threads[id].last_seen_time = threads[id].last_reply_time;
            changed = true;
          }
          if (watched_threads[id].known_reply_count != threads[id].reply_count) {
            watched_threads[id].known_reply_count = threads[id].reply_count;
            changed = true;
          }
          if (watched_threads[id].last_known_time != threads[id].last_reply_time) {
            watched_threads[id].last_known_time = threads[id].last_reply_time;
            changed = true;
          }
        }

        mod = isModPage ? data.mod : null;

        if (changed)
          save_watched_threads();
        populate_watcher_screen();
      }

      if (callback)
        callback(true);
    },
    error(jqXHR, textStatus) {
      if (textStatus == 'abort')
        return;
      console.log('Error retrieving watched threads'); //eslint-disable-line no-console
      if (callback)
        callback(false);
    },
    complete() {
      watcher_query = null;
    }
  });
}

function open_watcher() {
  const $watcherScreen = $('#watcherScreen');
  if ($watcherScreen.is(':hidden')) {
    $('.watcherButton').addClass('open');
    const $navbar = $('.boardlist.top');
    $watcherScreen
      .show()
      .css('position', $navbar.css('position') )
      .css('top', $navbar.height() );
  } else {
    $('.watcherButton').removeClass('open');
    $watcherScreen.hide();
  }
}

function populate_watcher_screen() {
  const $watcherScreen = $('#watcherScreen');
  let alerts = 0;

  const threads = Object.keys(watched_threads).map(id => {
    const match = /^(\w+):(\d+)$/.exec(id);
    const board = match[1];
    const postnum = +match[2];
    let unread_hash = '';
    if (
      watched_threads[id].known_reply_count != null &&
      watched_threads[id].last_known_time > watched_threads[id].last_seen_time &&
      page_thread_id != id
    ) {
      alerts++;
      unread_hash = '#unread';
    }
    return Object.assign({
      id, board, postnum,
      url: make_thread_url(board, postnum)+unread_hash,
      url50: watched_threads[id].known_reply_count > 100 ?
      make_thread50_url(board, postnum)+unread_hash : null
    }, watched_threads[id]);
  });

  if (mod) {
    if (mod.report_count)
      alerts += mod.report_count;
    if (mod.open_appeals_count)
      alerts += mod.open_appeals_count;
  }

  let pr;
  if ($watcherScreen[0]) {
    pr = new RSVP.Promise((resolve) => {
      ReactDOM.render(
        <WatcherMenu
          threads={threads}
          mod={mod}
          onRemove={remove_watch}
        />,
        $watcherScreen[0],
        resolve
      );
    });
  } else {
    pr = Promise.resolve();
  }
  renderWatcherAlerts(alerts);
  return pr;
}

function renderWatcherAlerts(count) {
  let $watcherAlerts = $('#watcherAlerts');
  if (count == 0) {
    $watcherAlerts.remove();
  } else {
    if ($watcherAlerts.length == 0) {
      $watcherAlerts = $('<span/>')
        .attr('id', 'watcherAlerts')
        .prependTo( $('.watcherButton') );
    }
    $watcherAlerts.text('('+count+')');
  }
}

//TODO
function run_watcher_refresher() {
  end_watcher_refresher();

  watcher_refresher_running = true;
  let multiplier = 1;

  function runner(success) {
    if (!shouldShowWatcher()) {
      watcher_refresher_running = false;
      return;
    }

    if (success)
      multiplier = 1;
    else
      multiplier++;

    watcher_refresher_timer = setTimeout(refresh_watched_threads, watcher_poll_time * multiplier, runner);
  }
  refresh_watched_threads(runner);
}

function init_watcher_menu() {
  $('.watcherButton, #watcherScreen').remove();

  // TODO fix
  const watcherPage = document.querySelector('XXX#scriptBasePage[data-page-id=watcher]');

  if (watcherPage) {
    $(watcherPage).html(
      $('<div class="homeblock"/>').append(
        $('<div/>').attr('id', 'watcherScreen')
      )
    );
  } else {
    if (!shouldShowWatcher())
      return;

    const $watcherButton = $('<a/>')
      .addClass('watcherButton')
      .text('watcher')
      .attr('href', config.site.siteroot+'watcher')
      .prependTo( $('.top .settingsSection') );

    $('<div/>')
      .attr('id', 'watcherScreen')
      .appendTo(document.body)
      .hide();

    $watcherButton.click(event => {
      open_watcher();
      event.preventDefault();
    });
  }

  populate_watcher_screen();
  run_watcher_refresher();
}

function watcher_acknowledge_page() {
  // Only acknowledge thread pages
  if ($('div.banner').length == 0)
    return;
  const threadid = get_post_id($('.thread .post.op').first());
  if (!(threadid in watched_threads))
    return;
  let reply_count = $('.thread .reply:not(.post-inline)').length;
  $('.thread .omitted').each(function() {
    const text = $(this).text();
    const match = /^(\d+) posts/.exec(text);
    if (match)
      reply_count += parseInt(match[1]);
  });

  let last_seen_time = 0;
  if ($('.thread .post:not(.post-inline):last').length) {
    last_seen_time = (new Date($('.thread .post:not(.post-inline):last .intro:first time').attr('datetime'))).getTime()/1000;
  }

  if (watched_threads[threadid].seen_reply_count != reply_count ||
    watched_threads[threadid].last_seen_time != last_seen_time) {
    load_watched_threads();
    watched_threads[threadid].seen_reply_count = reply_count;
    watched_threads[threadid].last_seen_time = last_seen_time;
    save_watched_threads();
  }

  populate_watcher_screen();
}

function jump_to_first_unread_post() {
  if (!page_thread_id)
    return false;
  if (!(page_thread_id in watched_threads))
    return false;
  const last_seen_time = watched_threads[page_thread_id].last_seen_time;
  if (!last_seen_time)
    return false;
  let jumped = false;
  $('.thread .reply').each(function() {
    const $post = $(this);
    const post_time = (new Date($post.find('.intro:first').find('time:first').attr('datetime'))).getTime()/1000;
    if (post_time > last_seen_time) {
      jumped = true;
      jumpToPost(get_post_id($post));
      return false;
    }
  });
  return jumped;
}

let page_thread_id = null;

$(document).ready(function() {
  if (!window.localStorage) return;

  if ($('div.banner').length && $('.thread .post.op').length)
    page_thread_id = get_post_id($('.thread .post.op').first());

  if ($('div.banner').length && window.location.hash == '#unread') {
    jump_to_first_unread_post();
  }

  watcher_acknowledge_page();
  init_watcher_menu();
  add_watch_buttons( $('.post.op') );

  let watcher_ack_pending = false;
  $(document).on('new_post', function(e, post) {
    const $post = $(post);
    if ($post.is('.op'))
      add_watch_buttons($post);

    if (!watcher_ack_pending) {
      watcher_ack_pending = true;
      setTimeout(function() {
        watcher_ack_pending = false;
        watcher_acknowledge_page();
      }, 50);
    }
  });
});
