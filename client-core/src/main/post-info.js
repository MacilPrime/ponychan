export function get_post_board($post) {
	return /\bpost_(\w+)-\d+\b/.exec($post.attr("class"))[1];
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
