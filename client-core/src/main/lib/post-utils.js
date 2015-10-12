import $ from 'jquery';
import {get_post_class, get_post_num_from_id} from './post-info';

// returns whether it found the post or not.
export function highlightPost(postid) {
	$('.highlighted').removeClass('highlighted');
	const $target = $('.'+get_post_class(postid));
	if ($target.length) {
		$target.addClass('highlighted');
		return true;
	} else {
		return false;
	}
}

export function jumpToPost(postid) {
	if (highlightPost(postid)) {
		document.location.hash = get_post_num_from_id(postid);
		return true;
	} else {
		return false;
	}
}
