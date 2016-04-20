const $ = require('jquery');
import {highlightPost} from './lib/post-utils';

function highlightActivePost() {
  if (global.board_id && /^#\d+$/.exec(window.location.hash)) {
    highlightPost(global.board_id + ':' + window.location.hash.substring(1));
  }
}

$(document).ready(highlightActivePost);
$(window).on('hashchange', highlightActivePost);
