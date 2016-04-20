/*
 * titlebar.js
 *
 * Released under the MIT license
 * Copyright (c) 2014 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import myPosts from './my-posts';
import {get_post_id} from './lib/post-info';
import {newViewablePosts} from './post-hiding';

let flash = {};
let flashmessage = '';
const unseenPosts = new Map();
export function hasSeen($post) {
  let id = get_post_id($post);
  return !unseenPosts.has(id);
}

// Temporary dummy function. Gets replaced later.
let updateTitle = function() {};

function updateTitleFlash() {
  flashmessage = '';
  $.each(flash, function(i, val) {
    flashmessage += val + ' ';
  });
  updateTitle();
}

export function setTitleFlash(key, message) {
  flash[key] = message;
  updateTitleFlash();
}

export function removeTitleFlash(key) {
  delete flash[key];
  updateTitleFlash();
}

$(document).ready(function() {
  const $icon = $('head link[rel="shortcut icon"]');

  if ($('div.banner').length == 0)
    return; // not index

  const titlePrefix = document.title.split('-')[0]+'- ';
  const titleSplit = document.title.split('-');
  if (titleSplit.length < 2)
    return;
  let titleEnd = titleSplit[1].slice(1);

  const opsubject = $('.post.op .subject').text().trim();
  if (opsubject) {
    titleEnd = opsubject;
  } else {
    const optext = $('.post.op .body').text().trim();
    if (optext) {
      if (optext.length > 20)
        titleEnd = optext.slice(0,20)+'...';
      else
        titleEnd = optext;
    }
  }

  const mainTitle = titlePrefix+titleEnd;
  $('.thread .post.reply' +
  ':not(.preview-hidden)' +
  ':not(.post-hover)' +
  ':not(.post-inline)')
    .each((i, post) => {
      const $post = $(post);
      unseenPosts.set(get_post_id($post), $post);
    });

  let pendingScrollHandler = null;

  updateTitle = function() {
    const newTitle = flashmessage + '('+unseenPosts.size+') '+mainTitle;
    if (document.title != newTitle) {
      document.title = newTitle;
    }
    const icon = unseenPosts.size ? global.SITE_DATA.url_favicon_alert : global.SITE_DATA.url_favicon;
    if ($icon.attr('href') !== icon) {
      $icon.attr('href', icon);
    }
  };

  function scrollHandler() {
    pendingScrollHandler = null;

    // If the page is hidden, we don't want to decrement the unseenPosts count yet,
    // so that way the tab title is accurate.
    if (global.Visibility.hidden())
      return;

    const seenPosts = [];
    for (let id of Array.from(unseenPosts.keys()).sort()) {
      let $post = unseenPosts.get(id);
      if ($post.is(':visible')) {
        let postBottom = $post.offset().top + $post.height();
        let screenBottom = $(window).scrollTop() + $(window).height();
        if (postBottom > screenBottom)
          break;
      }
      seenPosts.push(id);
      unseenPosts.delete(id);
    }
    updateTitle();
    if (seenPosts.length) {
      $(document).trigger('posts_seen', {
        posts: seenPosts
      });
    }
  }
  $(window).scroll(() => {
    if (pendingScrollHandler)
      return;
    pendingScrollHandler = setTimeout(scrollHandler, 100);
  });

  global.Visibility.change(scrollHandler);

  scrollHandler();

  newViewablePosts.onValue(post => {
    const $post = $(post);
    // Don't increase the counter for post previews
    if ($post.is('.post-preview, .post-hover, .post-inline') || $post.parent().is('.preview-hidden'))
      return;
    // Or for posts the user made themselves.
    if (myPosts.contains(get_post_id($post)))
      return;
    unseenPosts.set(get_post_id($post), $post);
    updateTitle();
    $(document).trigger('new_unseen_post', post);
  });
});
