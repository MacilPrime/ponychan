import $ from 'jquery';
import {get_post_class, get_post_num_from_id} from './post-info';

export function highlightPost(postid) {
	$('.highlighted').removeClass('highlighted');
	$('.'+get_post_class(postid)).addClass('highlighted');
}

export function jumpToPost(postid) {
	$(document).ready(() => {
		highlightPost(postid);
		document.location.hash = get_post_num_from_id(postid);
	});
}
