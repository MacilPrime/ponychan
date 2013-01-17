/*
 * fancy.js
 * For when you need things to be more fancy and proper.
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/settings.js';
 *   $config['additional_javascript'][] = 'js/post-hover.js';
 *
 */

settings.newProp("fancy_mode", "bool", false, "Fancy mode");

$(document).ready(function(){
	var fancy_mode = settings.getProp("fancy_mode");
	var show_fancy = false;
	init_fancy_option();
	
	$(document).on("setting_change", function(e, setting) {
		if (setting == "fancy_mode") {
			fancy_mode = settings.getProp("fancy_mode");
			init_fancy_option();
			fancify(document);
		}
	});

	function init_fancy_option() {
		if (fancy_mode) show_fancy = true;
		if (show_fancy) {
			$("#setting_fancy_mode").show();
		} else {
			$("#setting_fancy_mode").hide();
		}
	}

	$(document).keydown(function(event) {
		if(/TEXTAREA|INPUT/.test(event.target.nodeName))
			return true;

		if(!$('#settingsScreen').is(':visible'))
			return true;

		if(event.which == 70 && !event.ctrlKey && !event.shiftKey) {
			show_fancy = true;
			init_fancy_option();
			return false;
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
				images = $(context).find('> a > img');
			} else {
				images = $(context).find('.post.reply > a > img');
			}
			images.each(function() {
				var $img = $(this);
				var $post = $img.parent().parent();
				var $body = $post.find('> .body, > .opMain > .body').first();
				var hatleft = ($img.outerWidth()-65) * 0.5;
				$body.before('<img class="fancy hat" style="position:absolute;margin-top:-22px;margin-left:'+hatleft+'px;padding:0;height:56px;width:65px;" src="'+siteroot+'static/tophat.png">');
				var monoheight = ($img.outerHeight()-25) * 0.4;
				var monoleft = ($img.outerWidth()-30) * 0.8;
				$body.before('<img class="fancy monocle" style="position:absolute;margin-top:'+monoheight+'px;margin-left:'+monoleft+'px;padding:0;height:75px;width:30px;" src="'+siteroot+'static/monocle.png">');
			});
		}
	}
});
