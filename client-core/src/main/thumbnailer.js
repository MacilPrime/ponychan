/*
 * thumbnailer.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 * Based on code from
 * http://stackoverflow.com/questions/2303690/resizing-an-image-in-an-html5-canvas/3223466#3223466
 *
 */

import RSVP from 'rsvp';

function determine_thumbnail_res(orig_width, orig_height, max_x, max_y) {
  const scalex = max_x / orig_width;
  const scaley = max_y / orig_height;
  const scale = Math.min(scalex, scaley);
  const dest_width = Math.min(max_x, Math.round(scale*orig_width));
  const dest_height = Math.min(max_y, Math.round(scale*orig_height));

  return {width: dest_width, height: dest_height};
}

export function thumbnailer_simple(image, max_x, max_y) {
  return new RSVP.Promise(function(resolve, reject) {
    const dest = determine_thumbnail_res(image.width, image.height, max_x, max_y);

    if (dest.width >= image.width || dest.height >= image.height) {
      reject(new Error('image already small enough'));
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = dest.width;
      canvas.height = dest.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    }
  });
}
