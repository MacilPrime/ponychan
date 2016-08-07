/* @flow */

const Kefir = require('kefir');
import $ from 'jquery';
import udKefir from 'ud-kefir';
import {findPost} from './post-finder';
import {get_post_id} from '../lib/post-info';
import {onPostLinkEvent, markParentLinks} from './link-utils';
import settings from '../settings';

settings.newSetting('preview_hover',
  'bool', true,
  'Preview post on link hover', 'links',
  {orderhint: 2});

const update = udKefir(module, null).changes().take(1).toProperty();

function init() {
  onPostLinkEvent('mouseenter')
    .takeUntilBy(update)
    .filter(() => settings.getSetting('preview_hover'))
    .filter(({$link}) => !$link.hasClass('inlined'))
    .onValue(({$link}) => {
      const $post = findPost($link.attr('href'));
      startHover($link, $post);
      const end = Kefir.merge([
        Kefir.fromEvents($link, 'mouseleave'),
        Kefir.fromEvents($link, 'click')
      ]);
      Kefir.fromEvents($link, 'mousemove')
        .takeUntilBy(end)
        .onValue(event => {
          midHover(event, $post);
        })
        .onEnd(() => {
          $post.remove();
        });
    });
}

function startHover($link, $post) {
  const $parent = $link.closest('.post');
  const parentid = $parent.length ? get_post_id($parent) : null;
  $post.addClass('post-hover reply')
    .on('new_post', () => parentid && markParentLinks($post, parentid))
    .appendTo(document.body);
  $link.trigger('mousemove');
  // trigger mid hover to set a position.
}

function midHover(evt, $post) {
  // default coordinates on right
  const xy = Object.seal({
    left: evt.clientX + 25,
    right: 'auto',
    top: evt.clientY - 40,
    bottom: 'auto'
  });

  // set the coordinates so the size is calculated based on this first guess
  $post.css(xy);

  const windowWidth = $(window).width();
  const windowHeight = $(window).height();

  const post = $post.get(0);
  if (post.getBoundingClientRect) {
    // flip to left
    if (evt.clientX > windowWidth/2 && post.getBoundingClientRect().right > windowWidth) {
      xy.right = windowWidth - evt.clientX + 25;
      xy.left = 'auto';
      $post.css(xy);
    }
    // floor
    if (post.getBoundingClientRect().bottom > windowHeight) {
      xy.top = 'auto';
      xy.bottom = 0;
      $post.css(xy);
    } else {
      // ceiling
      const topOfPage = 35; // approximate height of nav bar
      if (xy.top < topOfPage) {
        xy.top = topOfPage;
        $post.css(xy);
      }
    }
  }
}

init();
