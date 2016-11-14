/* @flow
 * show-filenames.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import _ from 'lodash';
import settings from './settings';

settings.newSetting(
  'show_download_links', 'bool', true, 'Show quick file download links',
  'pagestyle', {orderhint: 5}
);

const supportsDownloadAttr = _.once(function() {
  const link = document.createElement('a');
  return 'download' in link;
});

$(document).ready(function() {
  function setup_filename_expander($fn) {
    const shortname = $fn.attr('data-fn-shortname') || $fn.text();
    const fullname = $fn.attr('data-fn-fullname');
    $fn
      .attr('data-fn-shortname', shortname)
      .attr('data-fn-fullname', fullname)
      .text(shortname)
      .off('.showfn')
      .on('mouseenter.showfn', function() {
        $fn.text(fullname);
      })
      .on('mouseleave.showfn', function() {
        $fn.text(shortname);
      });
  }

  function setup_filename_expander_in_context(context) {
    const showDownloadLinks: boolean = settings.getSetting('show_download_links');
    if (showDownloadLinks) {
      $('span.post-filename', context).each(function() {
        $(this).replaceWith(
          $('<a/>')
            .attr({
              class: this.className,
              title: this.getAttribute('data-old-title'),
              href: this.getAttribute('data-old-href'),
              download: this.getAttribute('data-old-download'),
              'data-fn-shortname': this.getAttribute('data-fn-shortname') || this.textContent,
              'data-fn-fullname': this.getAttribute('data-fn-fullname')
            })
            .text(this.textContent)
        );
      });
    } else {
      $('a.post-filename', context).each(function() {
        $(this).replaceWith(
          $('<span/>')
            .attr({
              class: this.className,
              'data-old-title': this.title,
              'data-old-href': this.href,
              'data-old-download': this.getAttribute('download'),
              'data-fn-shortname': this.getAttribute('data-fn-shortname') || this.textContent,
              'data-fn-fullname': this.getAttribute('data-fn-fullname')
            })
            .text(this.textContent)
        );
      });
    }

    $('.post-filename[data-fn-fullname]', context).each(function() {
      setup_filename_expander($(this));
    });

    if (!supportsDownloadAttr()) {
      $('.post-filename[title][download]', context).removeAttr('title');
    }
  }

  setup_filename_expander_in_context(document);
  $(document).on('new_post.showfn', function(e, post) {
    setup_filename_expander_in_context(post);
  });

  settings.getSettingStream('show_download_links').onValue(() => {
    setup_filename_expander_in_context(document);
  });
});
