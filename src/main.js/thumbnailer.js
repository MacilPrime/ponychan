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

var RSVP = require('rsvp');

function determine_thumbnail_res(orig_width, orig_height, max_x, max_y) {
	var scalex = max_x / orig_width;
	var scaley = max_y / orig_height;
	var scale = Math.min(scalex, scaley);
	var dest_width = Math.min(max_x, Math.round(scale*orig_width));
	var dest_height = Math.min(max_y, Math.round(scale*orig_height));

	return {width: dest_width, height: dest_height};
}

function thumbnailer(image, max_x, max_y) {
	return new RSVP.Promise(function(resolve, reject) {
		var dest = determine_thumbnail_res(image.width, image.height, max_x, max_y);

		if (dest.width >= image.width || dest.height >= image.height) {
			reject(new Error('image already small enough'));
		} else {
			var quick_x = max_x * 3;
			var quick_y = max_y * 3;
			if (image.width > quick_x || image.height > quick_y) {
				resolve(thumbnailer_simple(image, quick_x, quick_y).then(function(canvas) {
					return thumbnailer_fancy(canvas, max_x, max_y);
				}));
			} else {
				resolve(thumbnailer_fancy(image, max_x, max_y));
			}
		}
	});
}
exports.thumbnailer = thumbnailer;

function thumbnailer_simple(image, max_x, max_y) {
	return new RSVP.Promise(function(resolve, reject) {
		var dest = determine_thumbnail_res(image.width, image.height, max_x, max_y);

		if (dest.width >= image.width || dest.height >= image.height) {
			reject(new Error('image already small enough'));
		} else {
			var canvas = document.createElement('canvas');
			canvas.width = dest.width;
			canvas.height = dest.height;
			var ctx = canvas.getContext('2d');
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
			resolve(canvas);
		}
	});
}

function thumbnailer_fancy(image, max_x, max_y, lobes) {
	return new RSVP.Promise(function(resolve, reject) {
		if (lobes === undefined)
			lobes = 3;

		var dest = determine_thumbnail_res(image.width, image.height, max_x, max_y);

		if (dest.width >= image.width || dest.height >= image.height) {
			reject(new Error('image already small enough'));
		} else {
			var canvas = document.createElement('canvas');
			canvas.width = image.width;
			canvas.height = image.height;
			var ctx = canvas.getContext('2d');
			ctx.drawImage(image, 0, 0);

			var imageCPA = ctx.getImageData(0, 0, canvas.width, canvas.height);
			var imagedata = Array.prototype.slice.call(imageCPA.data);

			var worker = new Worker(siteroot+'js/thumbnailer-worker.js?v=10');
			worker.onmessage = function worker_onmessage(event) {
				if (event.data.result) {
					canvas.width = dest.width;
					canvas.height = dest.height;
					imageCPA = ctx.getImageData(0, 0, canvas.width, canvas.height);
					for (var i = 0; i < event.data.result.length; i++) {
						imageCPA.data[i] = event.data.result[i];
					}
					ctx.putImageData(imageCPA, 0, 0);
					resolve(canvas);
				} else if (event.data.message) {
					console.log('worker message: '+event.data.message);
				}
			};
			worker.onerror = reject;

			worker.postMessage({
				dest_width: dest.width,
				dest_height: dest.height,
				orig_width: image.width,
				orig_height: image.height,
				orig_data: imagedata,
				lobes: lobes
			});
		}
	});
}
