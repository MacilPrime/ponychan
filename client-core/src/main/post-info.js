import _ from 'lodash';

export function get_post_board($post) {
	return /\bpost_(\w+)-\d+\b/.exec($post.attr("class"))[1];
}

export function get_thread_num($post) {
    if ($post.hasClass("op")) {
        return parseInt(/\bpost_(\d+)\b/.exec($post.attr("class"))[1]);
    } else {
        return parseInt($post.data("thread"));
    }
}

export function get_post_num($post) {
	return parseInt(/\bpost_(\d+)\b/.exec($post.attr("class"))[1]);
}

export function get_post_id($post) {
	const match = /\bpost_(\w+)-(\d+)\b/.exec($post.attr("class"));
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

export function get_post_body($post) {
	return $post.find("> .body, > .opMain > .body").first();
}
