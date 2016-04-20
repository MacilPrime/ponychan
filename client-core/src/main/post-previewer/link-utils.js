const $ = require('jquery');
const Kefir = require('kefir');
import {Metadata} from './url-metadata';

export function onPostLinkEvent(evtName) {
  return Kefir.stream(emitter => {
    function listener(event) {
      emitter.emit({
        $link: $(event.target).closest('a.postlink'),
        event
      });
    }
    $(document).on(evtName, 'a.postlink', listener);
    return () => {
      $(document).off(evtName, 'a.postlink', listener);
    };
  });
}

export function markParentLinks($post, parentid) {
  // give the proper links the dashed underline
  $post.attr('data-parentid', parentid);
  $post.find('a.postlink').filter((i, anchor) => {
    const postLinkMeta = new Metadata(anchor.getAttribute('href'), global.board_id);
    return postLinkMeta.postid === parentid;
  }).addClass('parent-link');
}
