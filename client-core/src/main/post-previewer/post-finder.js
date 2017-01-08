/* @flow */

import $ from 'jquery';
import RSVP from 'rsvp';
import _ from 'lodash';
import * as ud from 'ud';
import {Metadata} from './url-metadata';
import {clearAllInline} from './post-inline';
import settings from '../settings';
import {mogrifyHTML} from '../mogrify';

export const findPost = ud.defn(module, function findPost(url: string) {
  const message = text => $('<div />').addClass('body bodynote').append(text);
  const $container = $('<div/>')
    .data('dummy', 'loading')
    .append(message('Loading...'))
    .addClass(['dummy', 'post', 'reply'].join(' '));

  loadPost(url).then($retrievedPost => {
    const $clone = $retrievedPost.clone();
    // fill the container with the post's contents. or,
    // fill it with a warning message.
    $container.html(() => {
      if (!settings.getSetting('show_mature') && $clone.hasClass('mature_post'))
        return message('This linked post is in a mature content thread, '+
      'and viewing mature content threads is currently disabled.');

      if (!settings.getSetting('reveal_spoiler_threads') && $clone.hasClass('spoiler_post'))
        return message([
          $('<p />').text('This post is from a spoilered thread.'),
          $('<a />').text('[View thread]')
            .addClass('spoilerviewlink')
            .attr('href', url)
        ]);

      if ($clone.data('filtered'))
        return message('This linked post is filtered.');

      return $clone.children();
    }).addClass($clone.attr('class'))
      .removeClass('post-loading post-preview dummy highlighted')
      .removeAttr('id')
      .find('[id]')
      .removeAttr('id');

    // Clear out inline containers from the clone.
    clearAllInline($container);
    $container.trigger('new_post', $container.get(0));
  }).catch(error => {
    $container.html(message(error));
  });

  return $container;
    // the post may or may not still be loading but we still need
    // the container either way!
}, 'findPost');


const threadCache = new Map();
// Later, this is populated with jquery ajax objects.

const loadPost = _.memoize(function(targetURL) {
  // 1. Will attempt to query the document to get your post first.
  // 2. Also performs ajax requests to get posts from external pages.
  //    - These posts are 'preprocessed' - they contain special flags
  //      to be properly marked as mature or spoilered, etc.
  // 1st param - ThreadURL, including hash.
  return new RSVP.Promise((resolve, reject) => {
    const meta = new Metadata(targetURL);
    const $foundPost = $('.thread > .postContainer > '+meta.toQuerySelector()).first();
    if ($foundPost.length > 0) {
      resolve($foundPost);
      return;
    }

    const threadURL = targetURL.replace(/#.*$/, '');

    let jqPromise = threadCache.get(threadURL);
    if (!jqPromise) {
      // When it's undefined, it's a page we haven't loaded yet.
      jqPromise = $.Deferred(
        dfr => $.ajax(threadURL, {cache: false}).then(dfr.resolve, dfr.reject)
      ).promise();
      threadCache.set(threadURL, jqPromise);
    }

    jqPromise.done((data) => {
      const $postC = $($.parseHTML(mogrifyHTML(data))).find('#replyC_'+meta.post);

      if ($postC.length == 0) {
        threadCache.delete(targetURL); // erase negative caches.
        reject('This post was either pruned or deleted.');
      } else {
        const $cloneC = $postC.clone()
          .removeAttr('id');
        const $cloneP = $cloneC.children('.post');

        // check if the parent thread is a spoiler.
        const isSpoiler = $postC.closest('.thread').find('.op .hashtag')
          .filter((i, hash) => /^#spoiler$/.test($(hash).text().toLowerCase()))
          .length > 0;

        if (isSpoiler) {
          $cloneP.addClass('spoiler_post');
        }

        $cloneC.find('[id]').removeAttr('id');
        resolve($cloneP);
      }
    }).fail((xhr, status, err) => {
      threadCache.delete(targetURL);
      reject('Error: '+xhr.status+' '+err);
    });
  });
});
