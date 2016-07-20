import $ from 'jquery';
import asap from 'asap';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import Menu from './Menu';
import ButtonLabel from './ButtonLabel';
import {footer} from '../../footer-utils';
import {get_post_id} from '../../lib/post-info';
import {jumpToPost} from '../../lib/post-utils';
import * as actions from './actions';

const max_watched_threads = 70;

export default function setupWatcherButton(store) {
  if (!window.localStorage) return;

  const $threadOp = $('div.banner').length ?
    $('.thread .post.op').first() : null;
  if ($threadOp && $threadOp.length) {
    const currentThreadId = get_post_id($threadOp);
    store.dispatch(actions.setCurrentThreadId(currentThreadId));
    if (window.location.hash == '#unread') {
      jump_to_first_unread_post(store);
    }
  }

  // watcher_acknowledge_page();
  asap(() => {
    // Currently needs to run after settings button is present.
    init_watcher_menu(store);

    // Needs to run after footer-utils has removed any leftover footers.
    add_watch_buttons(store, $('.post.op'));

    // let watcher_ack_pending = false;
    $(document).on('new_post', (e, post) => {
      const $post = $(post);
      if ($post.is('.op')) {
        add_watch_buttons(store, $post);
      }

      // if (!watcher_ack_pending) {
      //   watcher_ack_pending = true;
      //   setTimeout(function() {
      //     watcher_ack_pending = false;
      //     watcher_acknowledge_page();
      //   }, 50);
      // }
    });
  });
}

function jump_to_first_unread_post(store) {
  const {watchedThreads, currentThreadId} = store.getState().watcher;
  if (!currentThreadId)
    return;
  if (!Object.prototype.hasOwnProperty.call(watchedThreads, currentThreadId))
    return;
  const {last_seen_time} = watchedThreads[currentThreadId];
  if (last_seen_time == null)
    return;
  $('.thread .reply').each(function() {
    const $post = $(this);
    const post_time = (
      new Date($post.find('.intro:first time:first').attr('datetime'))
    ).getTime()/1000;
    if (post_time > last_seen_time) {
      jumpToPost(get_post_id($post));
      return false;
    }
  });
}


function add_watch(store, $post) {
  store.dispatch(actions.reloadWatchedThreads());
  const watchedThreads = store.getState().watcher.watchedThreads;

  if (Object.keys(watchedThreads).length >= max_watched_threads) {
    alert('Maximum number of threads watched already!');
    return;
  }

  const postid = get_post_id($post);
  const $intro = $post.find('.intro:first');
  const thread_data = {
    subject: $intro.find('.subject').text(),
    opname: $intro.find('.name').text(),
    optrip: $intro.find('.trip').text(),
    seen_reply_count: null,
    known_reply_count: null,
    last_seen_time: null,
    last_known_time: null,
    post: $post.find('.body:first:not(.post-inline-container)').text()
  };
  if (thread_data.post.length > 80) {
    thread_data.post = thread_data.post.slice(0,80)+'…';
  }

  store.dispatch(actions.watchThread(postid, thread_data));

  setTimeout(() => {
    alert('Thread watched.');
  }, 30);
}

function remove_watch(store, postid) {
  store.dispatch(actions.reloadWatchedThreads());
  store.dispatch(actions.unwatchThread(postid));
  setTimeout(() => {
    alert('Thread unwatched.');
  }, 30);
}

function add_watch_buttons(store, $posts) {
  $posts.each(function() {
    const $post = $(this);
    const postid = get_post_id($post);

    let watchedThreads = store.getState().watcher.watchedThreads;

    function updateButton() {
      if (Object.prototype.hasOwnProperty.call(watchedThreads, postid)) {
        footer($post).removeItem('Watch');
        footer($post).addItem('Unwatch', () => {
          remove_watch(store, postid);
        });
      } else {
        footer($post).removeItem('Unwatch');
        footer($post).addItem('Watch', () => {
          add_watch(store, $post);
        });
      }
    }

    updateButton();
    store.subscribe(() => {
      const newWatchedThreads = store.getState().watcher.watchedThreads;
      if (watchedThreads !== newWatchedThreads) {
        watchedThreads = newWatchedThreads;
        updateButton();
      }
    });
  });
}

function init_watcher_menu(store) {
  $('.watcherButton, #watcherScreen').remove();

  const $watcherContainer = $('<span/>')
    .prependTo( $('.top .settingsSection') );

  const $watcherScreen = $('<div/>')
    .attr('id', 'watcherScreen')
    .appendTo(document.body)
    .hide();

  renderButton();

  function renderButton() {
    ReactDOM.render(
      <Provider store={store}>
        <ButtonLabel
          opened={$watcherScreen.is(':visible')}
          onClick={event => {
            if (event.button !== 0) return;
            toggleWatcher();
            event.preventDefault();
          }}
          />
      </Provider>,
      $watcherContainer[0]
    );
  }

  function toggleWatcher() {
    if ($watcherScreen.is(':visible')) {
      $watcherScreen.hide();
      ReactDOM.unmountComponentAtNode($watcherScreen[0]);
    } else {
      const $navbar = $('.boardlist.top');
      $watcherScreen
        .show()
        .css('position', $navbar.css('position') )
        .css('top', $navbar.height() );
      ReactDOM.render(
        <Provider store={store}>
          <Menu />
        </Provider>,
        $watcherScreen[0]
      );
    }
    renderButton();
  }

}
