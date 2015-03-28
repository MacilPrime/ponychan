/*
 * fancy.js
 * For when you need things to be more fancy and proper.
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/settings.js';
 *   $config['additional_javascript'][] = 'js/fancy.js';
 *
 */

import $ from 'jquery';
import Bacon from 'baconjs';
import settings from './settings';

const revealer = Bacon.fromEvent(document, 'keydown')
	.filter(event =>
		event.which == 70 && !event.ctrlKey && !event.altKey &&
		!event.shiftKey && !event.metaKey
	)
	.filter(event => !/TEXTAREA|INPUT/.test(event.target.nodeName))
	.filter(() => $('.settingsScreen').is(':visible'))
	.doAction(event => event.preventDefault());

settings.newSetting("fancy_mode", "bool", false, "Fancy mode", 'pagestyle', {
	orderhint: 20, hidden: revealer});

$(document).ready(function(){
	var fancy_mode = settings.getSetting("fancy_mode");
	var fancy_pends = [];

	$(document).on("setting_change", function(e, setting) {
		if (setting == "fancy_mode") {
			fancy_mode = settings.getSetting("fancy_mode");
			cancelFancyPends();
			fancify(document);
		}
	});

	fancify(document);
	$(document).on('new_post', function(e, post) {
		fancify(post);
	});

	function fancify(context) {
		$(context).find('.fancy').remove();
		if (fancy_mode) {
			// grumble grumble there ought to be a better way to do this
			var images;
			if ($(context).is('.post.reply')) {
				images = $(context).find('> a > img.postimg');
			} else {
				images = $(context).find('.post.reply > a > img.postimg');
			}
			images.each(function(i) {
				var $img = $(this);
				function addfancy() {
					var $post = $img.parent().parent();
					var $body = $post.find("> .body").first();
					var hatleft = (($img.outerWidth()-65) * 0.5)-$img.outerWidth()-parseInt($img.css('margin-right'));
					$body.before('<img class="fancy hat" style="position:absolute;margin-top:-22px;margin-left:'+hatleft+'px;padding:0;height:56px;width:65px;" src="'+SITE_DATA.siteroot+'static/tophat.png">');
					var monoheight = ($img.outerHeight()-25) * 0.4;
					var monoleft = (($img.outerWidth()-30) * 0.8)-$img.outerWidth()-parseInt($img.css('margin-right'));
					$body.before('<img class="fancy monocle" style="position:absolute;margin-top:'+monoheight+'px;margin-left:'+monoleft+'px;padding:0;height:75px;width:30px;" src="'+SITE_DATA.siteroot+'static/monocle.png">');
				}
				if (i == 0) {
					addfancy();
				} else {
					fancy_pends.push(setTimeout(addfancy, i*5));
				}
			});
		}
	}

	function cancelFancyPends() {
		for(var i=0; i<fancy_pends.length; i++) {
			clearTimeout(fancy_pends[i]);
		}
		fancy_pends = [];
	}
});
