import _ from 'lodash';

export function get_post_board($post) {
	return /\bpostC?_(\w+)-\d+\b/.exec($post.attr("class"))[1];
}

export function get_post_num($post) {
	return parseInt(/\bpostC?_(\d+)\b/.exec($post.attr("class"))[1]);
}

export function get_post_id($post) {
	const match = /\bpostC?_(\w+)-(\d+)\b/.exec($post.attr("class"));
	return match[1]+':'+match[2];
}

export function get_post_class(postid) {
	const match = /^(\w+):(\d+)$/.exec(postid);
	return 'post_'+match[1]+'-'+match[2];
}

export function get_post_num_from_id(postid) {
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
