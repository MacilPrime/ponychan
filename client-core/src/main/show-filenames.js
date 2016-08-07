/* @flow
 * show-filenames.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import _ from 'lodash';

const supportsDownloadAttr = _.once(function() {
  const link = document.createElement('a');
  return 'download' in link;
});

$(document).ready(function() {
  function filename_expander(context) {
    $('.post-filename[data-fn-fullname]', context).each(function() {
      const $fn = $(this);
      const shortname = $fn.attr('data-fn-shortname') || $fn.text();
      const fullname = $fn.attr('data-fn-fullname');
      $fn
        .attr('data-fn-shortname', shortname)
        .attr('data-fn-fullname', fullname)
        .text(shortname)
        .hover(function() {
          $fn.text(fullname);
        }, function() {
          $fn.text(shortname);
        });
    });

    if (!supportsDownloadAttr()) {
      $('a.post-filename[title][download]', context).removeAttr('title');
    }
  }

  filename_expander(document);
  $(document).on('new_post.showfn', function(e, post) {
    filename_expander(post);
  });
});
