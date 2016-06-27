import $ from 'jquery';
import asap from 'asap';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import Menu from './Menu';
import ButtonLabel from './ButtonLabel';

export default function setupWatcherButton(store) {
  if (!window.localStorage) return;

  // TODO
  // if ($('div.banner').length && $('.thread .post.op').length) {
  //   page_thread_id = get_post_id($('.thread .post.op').first());
  // }
  //
  // if ($('div.banner').length && window.location.hash == '#unread') {
  //   jump_to_first_unread_post();
  // }
  //
  // watcher_acknowledge_page();
  asap(() => { // Currently needs to run after settings button is present.
    init_watcher_menu(store);
  });
  // add_watch_buttons( $('.post.op') );

  // let watcher_ack_pending = false;
  // $(document).on('new_post', function(e, post) {
  //   const $post = $(post);
  //   if ($post.is('.op')) {
  //     add_watch_buttons($post);
  //   }
  //
  //   if (!watcher_ack_pending) {
  //     watcher_ack_pending = true;
  //     setTimeout(function() {
  //       watcher_ack_pending = false;
  //       watcher_acknowledge_page();
  //     }, 50);
  //   }
  // });
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
