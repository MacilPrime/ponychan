/* @flow */

import _ from 'lodash';

export function get_post_board($post: any) {
  return /\bpostC?_(\w+)-\d+\b/.exec($post.attr('class'))[1];
}

export function get_thread_num($post: any) {
  if ($post.hasClass('op')) {
    return parseInt(/\bpost_(\d+)\b/.exec($post.attr('class'))[1]);
  } else {
    return parseInt($post.data('thread'));
  }
}

export function get_post_num($post: any) {
  return parseInt(/\bpost_(\d+)\b/.exec($post.attr('class'))[1]);
}

export function get_post_id($post: any) {
  const match = /\bpostC?_(\w+)-(\d+)\b/.exec($post.attr('class'));
  return match[1]+':'+match[2];
}

export function get_post_class(postid: string) {
  const match = /^(\w+):(\d+)$/.exec(postid);
  return 'post_'+match[1]+'-'+match[2];
}

export function get_post_num_from_id(postid: string) {
  return parseInt(/^\w+:(\d+)$/.exec(postid)[1], 10);
}

export const get_post_name = _.memoize($post =>
  $post.find('.intro .name').first().text()
);
get_post_name.cache = new WeakMap();

export const get_post_trip = _.memoize($post =>
  $post.find('.intro .trip').first().text()
);
get_post_trip.cache = new WeakMap();

export const get_post_ip = _.memoize($post => {
  const $ip = $post.find('.intro .posterip a').first();
  if ($ip.length > 0)
    return $ip.attr('data-old-text') || $ip.text();
  return null;
});
get_post_ip.cache = new WeakMap();

export function get_post_body($post: any) {
  return $post.find('> .body, > .opMain > .body').first();
}
