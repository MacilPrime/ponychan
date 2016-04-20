import $ from 'jquery';

$(document).ready(function() {
  $('.postfooter').remove();
});

/**
 * footer
 *
 * @param {jQuery} $post - The loose post to receive the footer item.
 * @method addItem - Inserts footer links. Use 2nd param for event callback
 *                   Currently, it WILL replace the link with the same name.
 * @method removeItem - Deletes footer links.
 */

export function footer($post) {
  return {
    addItem(name, callback) {
    // before we do anything, we need to remove the clones
      this.removeItem(name);

    // get the footer, or make a new one.
      function getFooter() {
        let $f = $post.children('.postfooter');
        return $f.length > 0 ? $f : $('<ul />')
        .addClass('postfooter')
        .appendTo($post);
      }

      getFooter()
        .filter(':not(.dead-buttons)')
        .append(
        $('<li />')
          .addClass('footer-item')
          .attr('data-footer', name.toLowerCase())
          .append(
          // Text can be changed without damaging its functionality.
          $('<a />')
            .text(name)
            .click(callback)
            .attr('href', 'javascript:;')
        )
      );

    },
    removeItem(name) {
      let $footer = $post.children('.postfooter');
      if ($footer.hasClass('dead-buttons'))
        return;
      $footer
      .children(`[data-footer="${name.toLowerCase()}"]`)
      .remove();

    // erase the footer if there are no more items
      if ($footer.children().length == 0) {
        $footer.remove();
      }
    },
    kill() {
      let $footer = $post.children('.postfooter');
      $footer
      .addClass('dead-buttons')
      .text($footer.text());
    }
  };
}
