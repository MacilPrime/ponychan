import $ from 'jquery';
import Kefir from 'kefir';
import udKefir from 'ud-kefir';
import {documentReady} from './lib/events';
import {hasSeen} from './titlebar';
import {footer} from './footer-utils';
import {get_post_body} from './lib/post-info';

const update = udKefir(module, null).changes().take(1).toProperty();

const isLast50Page = /\+50\.html/.test(document.location.href);

function init() {
  documentReady.takeUntilBy(update).onValue(() => {
    // Clean up existing controls that are stray on the page
    $('.new-editmsg').remove();

    Kefir.fromEvents($(document), 'thread_reloaded', (evt, data) => data)
      .takeUntilBy(update)
      .onValue(data => {
        const $data = $('<div />').append(data);
        const currentPosts = getPostsByIdInContext(document);
        const newPosts = getPostsByIdInContext($data);
        processChanges(currentPosts, newPosts);
      });
  });
}

function getPostsByIdInContext(context) {
  const posts = new Map();
  $('.thread > .postContainer > .post:not([data-deleted])', context).each(function() {
    posts.set(this.id, this);
  });
  return posts;
}

function processChanges(currentPosts, newPosts) {
  let hasSeenNewReply = false;
  currentPosts.forEach((post, id) => {
    const newPost = newPosts.get(id);

    if (!newPost) {
      if (true) return; //eslint-disable-line no-constant-condition

      // Temporarily disable until bug with your own posts is fixed. TODO
      if (isLast50Page && !hasSeenNewReply) return;

      const $post = $(post);
      $post.attr('data-deleted', 'true');
      const $intro = $post.find('.intro').first();
      $intro.find('input').prop('disabled', true);
      $intro.find('.citelink').after(
        ' ',
        $('<span />')
          .addClass('removedpost')
          .text('[Removed]')
      );
      $post.children('.controls')
        .addClass('dead-buttons')
        .each((i, el) => $(el).text($(el).text()));
      footer($post).kill();
    } else {
      const $post = $(post);
      if ($post.hasClass('reply')) {
        hasSeenNewReply = true;
      }
      const $newPost = $(newPost);

      const $newPostEditTime = $newPost.find('.editmsg time');
      if ($newPostEditTime.length > 0) {
        const $currentEditTime = $post
          .find('.editmsg time')
          .last();
        // the significance of 'last()' is that it avoids the
        // selector from wrongly selecting an inline post.

        if ($currentEditTime.length > 0) {
          // We're presented with an existing edit. Does the
          // new page present an even newer edit?
          const oldTS = Date.parse($currentEditTime.attr('datetime'));
          const newTS = Date.parse($newPostEditTime.attr('datetime'));
          if (newTS > oldTS)
            presentNewEdit($post, $newPost);
        } else {
          // If it started out with no edit, then any
          // presented edit is new to us.
          presentNewEdit($post, $newPost);
        }
      }
    }
  });
}

function presentNewEdit($oldPost, $newPost) {
  let $oldBody = get_post_body($oldPost);
  let $newBody = get_post_body($newPost);

  $oldBody.find('.new-editmsg').remove();
  if (hasSeen($oldPost)) {
    $('<div />')
      .addClass('editmsg new-editmsg')
      .append(
        'This post has a new edit.',
        $('<button />')
          .attr('type', 'button')
          .text('Load')
          .addClass('edit-revealer')
          .click(evt => {
            evt.preventDefault();
            reveal();
          })
      ).appendTo($oldBody);
  } else {
    reveal();
  }
  function reveal() {
    $oldBody.replaceWith($newBody);
    // Reset all events
    $oldPost.html($oldPost.html());
    $(document).trigger('new_post', $oldPost[0]);
  }
}

init();
