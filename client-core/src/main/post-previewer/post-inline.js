import $ from 'jquery';
import * as ud from 'ud';
import udKefir from 'ud-kefir';
import {Metadata} from './url-metadata';
import {findPost} from './post-finder';
import {get_post_id} from '../lib/post-info';
import {onPostLinkEvent, markParentLinks} from './link-utils';
import {highlightPost, jumpToPost} from '../lib/post-utils';
import settings from '../settings';

settings.newSetting('preview_inline',
  'bool', true,
  'Preview post inline on link click', 'links',
  {orderhint: 1});

const update = udKefir(module, null).changes().take(1).toProperty();
const linksToPreviews = ud.defonce(module, () => new WeakMap());

function init() {
  onPostLinkEvent('click')
    .takeUntilBy(update)
    .filter(({event}) => event.which === 1 && !event.ctrlKey && !event.shiftKey && !event.metaKey)
    .onValue(({event, $link}) => {
      const url = $link.attr('href');
      const meta = new Metadata(url);
      const board = meta.board || global.board_id;

      if (settings.getSetting('preview_inline')) {
        if (board) {
          highlightPost(board+':'+meta.post);
        }
        toggleInline($link);
        event.preventDefault();
      } else {
        let foundPost = false;
        if (board) {
          foundPost = jumpToPost(board+':'+meta.post);
        }
        if (foundPost) {
          event.preventDefault();
        }
      }
    });
  settings.getSettingStream('preview_inline')
    .takeUntilBy(update)
    .filter(value => !value)
    .onValue(() => {
      // Remove all inline posts if turned off.
      clearAllInline(document);
    });
}


function toggleInline($link) {
  const url = $link.attr('href');
  const meta = new Metadata(url);
  if ($link.hasClass('parent-link')) return;

  // Determining reference frame for the bin's position differs
  // depending on whether the links are in the header or not.
  const $before = $link.hasClass('backlink') ? $link.closest('.intro') : $link;

  const getOrCreateWrap = function() {
    if ($before.next().hasClass('inline-wrap'))
      return $before.next();
    else
    return $('<div />')
      .addClass('inline-wrap')
      .insertAfter($before);
  };

  if ($link.hasClass('inlined')) {
    $link.removeClass('inlined');

    const $post = $(linksToPreviews.get($link[0]));
    $post.remove();
    const $cont = getOrCreateWrap();
    if ($cont.children().length == 0) {
      $cont.remove();
    }
  } else {
    const $post = findPost(url);
    linksToPreviews.set($link[0], $post[0]);
    const $parent = $link.closest('.post');
    const parentid = $parent.length ? get_post_id($parent) : null;

    $link.addClass('inlined');
    $post.addClass('post-inline')
      .on('new_post', (e) => {
        if (parentid) {
          markParentLinks($post, parentid);
        }

        // Give inline posts a link to make it easy
        // to navigate on a mobile device.
        const $permalink = $link
          .closest('.post')
          .find('.permalink')
          .first();
        if ($permalink.length > 0 && $link.hasClass('bodylink')) {
          let parentMeta = new Metadata($permalink.get(0).getAttribute('href'));
          if (meta.thread != parentMeta.thread) {
            let $intro = $(e.currentTarget).find('.intro').first();
            $intro.find('.threadviewlink').remove();
            $intro.append($('<a />')
            .text('[View]')
            .attr('href', $link.attr('href'))
            .addClass('threadviewlink'));
          }
        }
      }).prependTo(getOrCreateWrap());
  }
}

export function clearAllInline($context) {
  $('.inlined', $context).removeClass('inlined');
  $('.inline-wrap', $context).remove();
}

init();
