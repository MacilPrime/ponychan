const _ = require('lodash');
const $ = require('jquery');
const asap = require('asap');
const Kefir = require('kefir');
import {Metadata} from './post-previewer/url-metadata';
import {filterStart, newViewablePosts} from './post-hiding';
import udKefir from 'ud-kefir';
import {get_post_id} from './lib/post-info';
import {documentReady, newPosts} from './lib/events';
import {markParentLinks} from './post-previewer/link-utils';

const update = udKefir(module, null).changes().take(1).toProperty();

// keys are postids, values are sets of postids that should be shown as
// backlinks on the key postid
const postsToBacklinks = new Map();

let renderIsScheduled = true;
const postsThatBacklinksRendered = new Set();

function addBacklinkToPost(backlinkid, postid) {
  let backlinks = postsToBacklinks.get(postid);
  if (!backlinks) {
    backlinks = new Set();
    postsToBacklinks.set(postid, backlinks);
  }
  if (!backlinks.has(backlinkid)) {
    backlinks.add(backlinkid);
    postsThatBacklinksRendered.add(postid);
    if (!renderIsScheduled) {
      renderIsScheduled = true;
      asap(renderUpdatedBacklinks);
    }
  }
}

function start() {
  // Possible room for improvement: incrementally process the page.
  parsePage();
  renderUpdatedBacklinks();
}

function parsePage() {
  $('.thread > .postContainer > .post').each(function() {
    parsePost(this);
  });
}

function parsePost(post) {
  const $post = $(post);
  if ($post.attr("data-filtered")) return;
  const postid = get_post_id($post);
  $post.find('> .body a.postlink').each(function() {
    const metadata = new Metadata($(this).attr('href'), global.board_id);
    addBacklinkToPost(postid, metadata.postid);
  });
}

function renderUpdatedBacklinks() {
  postsThatBacklinksRendered.forEach(postid => {
    const [board, postnum] = postid.split(':');
    $(`.post_${board}-${postnum}`).each(function() {
      placeBacklinksOnPost(this);
    });
  });
  postsThatBacklinksRendered.clear();
  renderIsScheduled = false;
}

function placeBacklinksOnPost(post) {
  const $post = $(post);
  const postid = get_post_id($post);
  const backlinks = postsToBacklinks.get(postid);
  if (!backlinks || !backlinks.size) return;

  $post.find('> .intro > .mentioned').remove();
  const $mentioned = $('<span/>')
    .addClass('mentioned');
  Array.from(backlinks).sort().forEach(backlinkid => {
    const [backlinkboard, backlinknum] = backlinkid.split(':');
    if (global.board_id !== backlinkboard) return;
    $('<a/>')
      .addClass(`postlink backlink`)
      .attr('href', `#${backlinknum}`)
      .text(`>>${backlinknum}`)
      .appendTo($mentioned);
  });
  $mentioned.appendTo($post.find('> .intro'));
  const parentid = $post.attr('data-parentid');
  if (parentid) {
    markParentLinks($post, parentid);
  }
}

filterStart
  .takeUntilBy(update)
  .onValue(start);

newViewablePosts
  .takeUntilBy(update)
  .onValue(parsePost);

newPosts
  .takeUntilBy(update)
  .onValue(placeBacklinksOnPost);
