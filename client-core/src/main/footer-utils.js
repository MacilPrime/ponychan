/**
 * footer-utils.js
 *
 * Builds and removes footer buttons.
 * Created on 4/10/2015
 */



import $ from 'jquery';

/**
 * footer
 *
 * @param {jQuery} $post - The loose post to receive the footer item.
 * @method addItem - Inserts footer links. Use 2nd param for event callback
 *                   Currently, it won't replace the link with the same name.
 * @method removeItem - Deletes footer links.
 */

export function footer($post) {
    return {
        addItem: function (name, callback) {

            // get the footer, or make a new one.
            let $footer = (function () {
                let $f = $post.children(".postfooter");
                return $f.length > 0 ? $f : $("<ul />")
                    .addClass("postfooter")
                    .appendTo($post);
            })();

            // outer container
            let $li = $("<li />")
                .addClass("footer-item")
                .attr("data-footer", name.toLowerCase())
                .appendTo($footer);

            // Text can be changed without damaging its functionality.
            $("<a />")
                .text(name)
                .on("click", callback)
                .attr("href", "javascript:;")
                .appendTo($li);

    },
        removeItem: function (name) {
            let $footer = $post.children(".postfooter");
            $footer
                .children("[data-footer='" + name.toLowerCase() + "']")
                .remove();

            // erase the footer if there are no more items
            if ($footer.children().length == 0) {
                $footer.remove();
            }
        }
    }
}