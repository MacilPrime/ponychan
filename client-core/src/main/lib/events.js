/* @flow */

const $ = require('jquery');
const Kefir = require('kefir');

export const documentReady = Kefir.stream(emitter => {
  $(document).ready(() => {
    emitter.emit(null);
    emitter.end();
  });
  return () => {};
}).toProperty();

export const newPosts = Kefir.fromEvents(
  $(document),
  'new_post',
  (event, post) => post
);
