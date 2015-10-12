const _ = require('lodash');
const $ = require('jquery');
const asap = require('asap');
const Kefir = require('kefir');
import {Metadata} from './post-previewer/url-metadata';
import {filterStart, newViewablePosts} from './post-hiding';
import udKefir from 'ud-kefir';
import {documentReady, newPosts} from './lib/events';

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
  const m = /\bpost_(\w+)-(\d+)/.exec(post.className);
  if (!m) return;
  const postid = `${m[1]}:${m[2]}`;
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
  const m = /\bpost_(\w+)-(\d+)/.exec(post.className);
  if (!m) return;
  const board = m[1];
  const postnum = +m[2];
  const postid = `${m[1]}:${m[2]}`;
  const backlinks = postsToBacklinks.get(postid);
  if (!backlinks || !backlinks.size) return;

  const $post = $(post);
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
