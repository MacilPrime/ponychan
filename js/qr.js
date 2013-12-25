/*
 * qr.js
 *
 * Released under the MIT license
 * Copyright (c) 2013 Macil Tech <maciltech@gmail.com>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/thumbnailer.js';
 *   $config['additional_javascript'][] = 'js/settings.js';
 *   $config['additional_javascript'][] = 'js/qr.js';
 *
 */

settings.newSetting("use_QR", "bool", false, "Use Quick Reply dialog for posting", 'posting', {moredetails:"Lets you post without refreshing the page. Q is the quick keyboard shortcut.", orderhint:1});
settings.newSetting("QR_persistent", "bool", false, "Persistent QR (Don't close after posting)", 'posting', {orderhint:2});
settings.newSetting("QR_flexstyle", "bool", true, "Use small persona fields on QR", 'posting', {orderhint:3});

$(document).ready(function(){
	var useFile = typeof FileReader != "undefined" && !!FileReader;
	var useFormData = typeof FormData != "undefined" && !!FormData;
	var useCanvas = !!window.HTMLCanvasElement;
	var useWorker = !!window.Worker;
	var usewURL = false;
	var wURL = window.URL || window.webkitURL;
	if(typeof wURL != "undefined" && wURL) {
		if(typeof wURL.createObjectURL != "undefined" && wURL.createObjectURL)
			usewURL = true;
	}
	
	if (!(window.CSS && CSS.supports && CSS.supports("display","flex"))) {
		$("#setting_QR_flexstyle").hide();
	}
	
	var useQueuing = useFile && useFormData && usewURL;
	
	var $oldForm = $("form[name='post']");
	var $oldName = $oldForm.find("input[name='name']");
	var $oldEmail = $oldForm.find("input[name='email']");
	var $oldSubject = $oldForm.find("input[name='subject']");
	var $oldFile = $oldForm.find("input[name='file']");

	if ($oldForm.length == 0)
		return;

	$("#qrtoggleoptions").remove();
	var $QRToggleOptions = $("<div/>")
		.attr("id", "qrtoggleoptions")
		.insertBefore($oldForm);

	var $QRToggleLabel = $("<label/>")
		.text(" Use Quick Reply dialog")
		.attr("for", "qrtogglebox")
		.appendTo($QRToggleOptions);
	
	var $QRToggleCheckbox = $("<input/>")
		.attr("id", "qrtogglebox")
		.attr("type", "checkbox")
		.prependTo($QRToggleLabel);

	var $QRButtonDiv = $("<div/>")
		.attr("id", "qrDisplayButtonDiv")
		.appendTo($QRToggleOptions);
	var $QRButton = $("<a/>")
		.attr("id", "qrDisplayButton")
		.attr("href", "javascript:;")
		.text("Open the Quick Reply dialog")
		.appendTo($QRButtonDiv);

	$("#qr").remove();
	
	var $QR = $("<div/>")
		.attr("id", "qr")
		.css("top", 0)
		.css("right", 0)
		.css("left", "")
		.css("bottom", "")
		.hide()
		.data('at top', true)
		.appendTo(document.body);
	var $QRmove = $("<div/>")
		.attr("id", "qrmove")
		.appendTo($QR);
	var $QRCloseButton = $("<a/>")
		.attr("href", "javascript:;")
		.text("X")
		.appendTo($QRmove);
	var $QRUpButton = $("<a/>")
		.attr("href", "#")
		.text("▲")
		.appendTo($QRmove);
	var $QRDownButton = $("<a/>")
		.attr("href", "javascript:;")
		.text("▼")
		.click(function() {
			window.scrollTo(0, document.body.scrollHeight);
		})
		.appendTo($QRmove);
	var $QRImagesWrapper = $("<div/>")
		.attr("id", "qrimageswrapper")
		.hide()
		.appendTo($QR);
	var $QRImages = $("<div/>")
		.attr("id", "qrimages")
		.appendTo($QRImagesWrapper);
	var $QRAddImageButton = $("<a/>")
		.attr("id", "qraddimage")
		.attr("href", "javascript:;")
		.attr("title", "Add reply")
		.text("+")
		.click(function() {
			if (!query) {
				$QRImagesWrapper.show();
				addReply();
			}
		})
		.appendTo($QRImages);
	var $QRToggleImagesButton = $("<a/>")
		.attr("href", "javascript:;")
		.attr("title", "Toggle reply queue")
		.text("+")
		.click(function() {
			$QRImagesWrapper.toggle();
		})
		.appendTo($QRmove);
	var $QRForm = $("<form/>")
		.attr("id", "qrform")
		.attr("method", "post")
		.attr("action", $oldForm.attr("action") )
		.attr("enctype", "multipart/form-data")
		.appendTo($QR);
	
	var $persona = $("<div/>")
		.attr("id", "qrpersona")
		.appendTo($QRForm);
	
	var $name = $("<input/>")
		.attr("id", "qrname")
		.attr("type", "text")
		.attr("name", "name")
		.attr("placeholder", "Name")
		.attr("maxlength", 75)
		.attr("size", 1)
		.val( $oldName.val() )
		.appendTo($persona);
	var $email = $("<input/>")
		.attr("id", "qremail")
		.attr("type", "text")
		.attr("name", "email")
		.attr("placeholder", "Email")
		.attr("maxlength", 254)
		.attr("size", 1)
		.val( $oldEmail.val() )
		.appendTo($persona);
	var $subject = $("<input/>")
		.attr("id", "qrsubject")
		.attr("type", "text")
		.attr("name", "subject")
		.attr("placeholder", "Subject")
		.attr("maxlength", 100)
		.attr("size", 1)
		.val( $oldSubject.val() )
		.appendTo($persona);
	var $comment = $("<textarea/>")
		.attr("id", "qrcomment")
		.attr("placeholder", "Comment")
		.attr("name", "body")
		.appendTo($QRForm);
	var $QRCaptchaDiv = $("<div/>")
		.appendTo($QRForm);
	var $QRCaptchaPuzzleDiv = $("<div/>")
		.attr("id", "qrCaptchaPuzzle")
		.attr("title", "Reload CAPTCHA")
		.appendTo($QRCaptchaDiv);
	var $QRCaptchaPuzzleImage = $("<img/>")
		.appendTo($QRCaptchaPuzzleDiv);
	var $QRCaptchaAnswerDiv = $("<div/>").appendTo($QRCaptchaDiv);
	var $QRCaptchaChallengeField = $("<input/>")
		.attr("id", "qrCaptchaChallenge")
		.attr("name", "recaptcha_challenge_field")
		.attr("type", "hidden")
		.appendTo($QRCaptchaAnswerDiv);
	var $QRCaptchaAnswer = $("<input/>")
		.attr("id", "qrCaptchaAnswer")
		.attr("type", "text")
		.attr("placeholder", "Verification")
		.attr("name", "recaptcha_response_field")
		.attr("size", 1)
		.appendTo($QRCaptchaAnswerDiv);
	var $captchaPuzzle = $("#recaptcha_image");
	if($captchaPuzzle.length == 0)
		$QRCaptchaDiv.hide();
	var $buttonrow = $("<div/>")
		.attr("id", "qrbuttonrow")
		.appendTo($QRForm);
	var $file = $("<input/>")
		.attr("id", "qrfile")
		.attr("type", "file")
		.attr("name", "file")
		.attr("accept", "image/*")
		.appendTo($buttonrow);
	var $filebutton = $("<button/>")
		.attr("id", "qrfilebutton")
		.text("Browse...")
		.click(function(e) {
			e.preventDefault();
			$file.click();
		})
		.appendTo($buttonrow);
	var $submit = $("<input/>")
		.attr("id", "qrsubmit")
		.attr("type", "submit")
		.attr("name", "post")
		.attr("accesskey", "s")
		.appendTo($buttonrow);
	var $row = $("<div/>")
		.css("min-width", "100%")
		.appendTo($QRForm);
	var $spoiler = $("<input/>")
		.attr("id", "qrspoiler")
		.attr("type", "checkbox")
		.attr("name", "spoiler");
	var $spoilerlabel = $("<label/>")
		.text("Spoiler Image")
		.attr("for", "qrspoiler")
		.prepend($spoiler)
		.appendTo($row);
	var $mature = $("<input/>")
		.attr("id", "qrmature")
		.attr("type", "checkbox")
		.attr("name", "mature");
	var $maturelabel = $("<label/>")
		.text("Mature Content")
		.attr("id", "qrmaturelabel")
		.attr("for", "qrmature")
		.prepend($mature)
		.appendTo($row);
	var $auto = $("<input/>")
		.attr("id", "qrauto")
		.attr("type", "checkbox")
	var $autolabel = $("<label/>")
		.text("Auto Mode")
		.attr("title", "Automatically post the next reply in queue")
		.attr("for", "qrauto")
		.prepend($auto)
		.appendTo($row);
	var $modrow = $("<div/>")
		.css("min-width", "100%")
		.appendTo($QRForm);
	var $sticky = $("<input/>")
		.attr("id", "qrsticky")
		.attr("type", "checkbox")
		.attr("name", "sticky");
	var $stickylabel = $("<label/>")
		.text("Sticky")
		.attr("for", "qrsticky")
		.prepend($sticky)
		.appendTo($modrow);
	var $lock = $("<input/>")
		.attr("id", "qrlock")
		.attr("type", "checkbox")
		.attr("name", "lock");
	var $locklabel = $("<label/>")
		.text("Lock")
		.attr("for", "qrlock")
		.prepend($lock)
		.appendTo($modrow);
	var $rawhtml = $("<input/>")
		.attr("id", "qrraw")
		.attr("type", "checkbox")
		.attr("name", "raw");
	var $rawhtmllabel = $("<label/>")
		.text("Raw HTML")
		.attr("for", "qrraw")
		.prepend($rawhtml)
		.appendTo($modrow);
	var $QRwarning = $("<div/>")
		.attr("id", "qrwarning")
		.click(function() {
			$QRwarning.text("");
		})
		.appendTo($QRForm);
	var $password = $("<input/>")
		.attr("type", "hidden")
		.attr("name", "password")
		.val( $("form[name='postcontrols'] input#password").val() )
		.appendTo($QRForm);
	if( $oldForm.find("#spoiler").length == 0 ) {
		$spoilerlabel.remove();
	}
	if( $oldForm.find("#raw").length == 0 ) {
		$rawhtmllabel.remove();
	}
	if( $oldForm.find("#lock").length == 0 ) {
		$locklabel.remove();
	}
	if( $oldForm.find("#sticky").length == 0 ) {
		$stickylabel.remove();
	}
	function init_mature_button() {
		if( $oldForm.find("#mature").length == 0 || !settings.getSetting("show_mature") )
			$maturelabel.hide();
		else
			$maturelabel.show();
	}
	init_mature_button();
	
	var QRInputNames = {};
	$("input, textarea", $QRForm).each(function() {
		var name = $(this).attr("name");
		if (name)
			QRInputNames[name] = true;
	});

	// DOM setup over.

	settings.bindCheckbox($QRToggleCheckbox, "use_QR");

	function resetFileInput() {
		if (/MSIE/.test(navigator.userAgent)) {
			$file.replaceWith($file=$file.clone(true));
		} else {
			$file.val('');
		}
	}

	var use_QR;
	var query = null;

	QR = {};

	QR.isEnabled = function() {
		return use_QR;
	};

	QR.open = function() {
		if(!use_QR) {
			console.error("QR.open called when use_QR was false");
			return;
		}
		if($QR.is(":hidden")) {
			$QR.show();
		}
		loadQRposition();
		if($QR.data('at top')) {
			if($(".boardlist.top").css("position")=="fixed") {
				$QR.css("top", $(".boardlist.top").height());
			} else {
				$QR.css("top", 0);
			}
		}
		$('head meta[name=viewport]').remove();
		$('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">');
	};

	QR.clear = function() {
		$comment.val("");
		resetFileInput();
		$file.change();
		$QRwarning.text("");
		$spoiler.prop("checked", false);
		$rawhtml.prop("checked", false);
		$lock.prop("checked", false);
		$sticky.prop("checked", false);
		if (query) {
			query.abort();
			query = null;
		}
	};

	QR.close = function() {
		if (replies.length) {
			while (replies.length > 1) {
				replies[0].rm();
			}
			replies[0].rm();
		}
		$QR.hide();
		QR.clear();
		$('head meta[name=viewport]').remove();
		$('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">');
	};

	$QRButton.click(function() {
		QR.open();
		return false;
	});

	$QRCloseButton.click(function() {
		QR.close();
		return false;
	});
	
	function prepSubmitButton() {
		$submit.val( $oldForm.find("input[type='submit']").val() ).prop("disabled", false);
	}
	prepSubmitButton();
	
	function QRcooldown(time) {
		if (time > 0) {
			$submit.val(time).prop("disabled", true);
			setTimeout(QRcooldown, 1000, time-1);
		} else {
			prepSubmitButton();
			if ($auto.is(":checked") && (selectedreply.comment || selectedreply.file))
				submitPost();
		}
	}

	if (!usewURL) {
		$QRToggleImagesButton.hide();
	}
	
	var replies = [];
	function reply() {
		this.file = null;
		this.fileurl = null;
		this.comment = "";
		var that = this;
		this.el = $("<div/>")
			.attr("class", "qrthumb")
			.click(function(e) {
				e.preventDefault();
				if (!query) {
					if (e.shiftKey) {
						that.rmfile();
					} else {
						that.select();
					}
				}
			})
			.insertBefore($QRAddImageButton);
		$("<a/>")
			.attr("class", "qrremovethumb")
			.attr("title", "Remove reply")
			.text("x")
			.click(function(e) {
				e.preventDefault();
				e.stopPropagation();
				if (!e.shiftKey && !query)
					that.rm();
			})
			.appendTo(this.el);
		this.setfile = function(file) {
			var _this = this;
			
			if (this.file != null)
				this.rmfile(true);
			this.file = file;
			this.el.attr("title", file.name + " (" + getFileSizeString(file.size) + ") (Shift+Click to remove image from reply)");
			if (usewURL) {
				this.fileurl = wURL.createObjectURL(file);
				this.el.css("background-image", "url(" + this.fileurl + ")");
				if (useCanvas && useWorker) {
					var render_job = Q.defer();
					this.filethumb = render_job.promise;
					
					var fileimg = new Image();
					fileimg.onload = function() {
						var maxX = parseInt($oldFile.attr("data-thumb-max-width"));
						var maxY = parseInt($oldFile.attr("data-thumb-max-height"));
						
						var start = new Date().getTime();
						var thumber = thumbnailer(fileimg, maxX, maxY);
						var thumber_timing = thumber.then(function() {
							var end = new Date().getTime();
							var time = end-start;
							console.log('thumbnailing took '+time+' milliseconds');
							return time;
						});
						render_job.resolve(Q.all([thumber, thumber_timing]));
						
						// If the original image was really big, then replace the image preview
						// in the QR with the thumbnail we just made.
						// Some browsers (webkit) lag when too big of an image is there.
						if (this.width >= 1000 || this.height >= 1000) {
							thumber.then(function(filethumb) {
								// If the image has already been changed by the user, we don't want to replace the wrong thumbnail.
								if (_this.file === file) {
									_this.el.css("background-image", 'url("' + filethumb.toDataURL('image/png') + '")');
									
									if (typeof wURL.revokeObjectURL != "undefined" && wURL.revokeObjectURL && _this.fileurl) {
										wURL.revokeObjectURL(_this.fileurl);
										delete _this.fileurl;
									}
								}
							});
						}
					};
					fileimg.src = this.fileurl;
				}
			}
		}
		this.select = function() {
			$("#qrthumbselected").removeAttr("id");
			this.el.attr("id", "qrthumbselected");
			if (selectedreply != this) {
				if (!useFile || $file[0].files.length && this.file != $file[0].files[0])
					resetFileInput();
			}
			selectedreply = this;
			$comment.val(selectedreply.comment)
				.off(".selectedreply")
				.on("input.selectedreply change.selectedreply", function() {
					selectedreply.comment = $comment.val();
				});
		}
		this.rmfile = function(dontResetFileInput) {
			if (this.file != null) {
				delete this.filethumb;
				delete this.filethumboktoskip;
				if (usewURL && typeof wURL.revokeObjectURL != "undefined" && wURL.revokeObjectURL && this.fileurl) {
					wURL.revokeObjectURL(this.fileurl);
					delete this.fileurl;
				}
				delete this.file;
				this.el.css("background-image", "none")
					.attr("title", "");
			}
			if (!dontResetFileInput && selectedreply === this) {
				resetFileInput();
			}
		}
		this.rm = function() {
			this.rmfile();
			if (replies.length > 1) {
				this.el.remove();
				var index = replies.indexOf(this);
				replies.splice(index, 1);
			} else {
				$QRImagesWrapper.hide();
				this.comment = "";
			}
			// Even if this was the only reply and we
			// didn't remove it, still reselect it so the
			// comment field and such gets reset.
			if (selectedreply === this)
				replies[0].select();
		}
	}
	
	function addReply() {
		selectedreply = new reply();
		selectedreply.select();
		replies.push(selectedreply);
	}
	
	var selectedreply = null;
	addReply();
	
	var maxsize = $oldFile.attr("data-max-filesize");
	
	if (!useQueuing) {
		$QR.addClass("noQueuing");
		$autolabel.hide();
		$QRAddImageButton.hide();
		QR.fileInput = function(files) {
			$QRwarning.text("");
			if (!files || files.length != 1)
				return;
			var file = files[0];
			if (!file)
				return;
			
			if ('size' in file && file.size > maxsize) {
				$QRwarning.text(file.name + " is too large");
				resetFileInput();
				return;
			} else if ('type' in file && !/^image\//.test(file.type)) {
				$QRwarning.text(file.name + " has an unsupported file type");
				resetFileInput();
				return;
			}
			
			selectedreply.setfile(file);
			if (usewURL)
				$QRImagesWrapper.show();
			
			if (useFormData && useFile) {
				if ($file[0].files && ($file[0].files.length > 1 || ($file[0].files.length && this.file != $file[0].files[0])))
					resetFileInput();
			}
		};
	} else {
		$QR.addClass("queuing");
		$file.attr("multiple", "");
		QR.fileInput = function(files) {
			$QRwarning.text("");
			if (!files || files.length == 0)
				return;
			
			if (usewURL)
				$QRImagesWrapper.show();
			
			for (var i = 0, len = files.length; i < len; i++) {
				var file = files[i];
				
				if ('size' in file && file.size > maxsize) {
					$QRwarning.text(file.name + " is too large");
				} else if ('type' in file && !/^image/.test(file.type)) {
					$QRwarning.text(file.name + " has an unsupported file type");
				} else if (selectedreply.file == null) {
					selectedreply.setfile(file);
				} else {
					if (files.length == 1 && i == 0) {
						selectedreply.setfile(file);
					} else {
						var newreply = new reply();
						newreply.setfile(file);
						replies.push(newreply);
					}
				}
			}
			resetFileInput();
		};
	}

	if (useFormData && useFile) {
		$(document).on("drop.qrfile", function(event) {
			var oEvent = event.originalEvent;
			if (!use_QR || !('dataTransfer' in oEvent) || !('files' in oEvent.dataTransfer) || $.inArray("Files", oEvent.dataTransfer.types) == -1 || !oEvent.dataTransfer.files || oEvent.dataTransfer.files.length == 0 )
				return;
			QR.open();
			QR.fileInput(oEvent.dataTransfer.files);
			event.preventDefault();
		});
		$(document).on("dragover.qrfile", function(event) {
			var oEvent = event.originalEvent;
			if (!use_QR || !('dataTransfer' in oEvent) || !('files' in oEvent.dataTransfer) || $.inArray("Files", oEvent.dataTransfer.types) == -1 )
				return;
			oEvent.dataTransfer.dropEffect = "copy";
			event.preventDefault();
		});
	}
	
	$file
		.attr("title", "Shift+Click to remove the selected image")
		.change(function() {
			if ('files' in this) {
				QR.fileInput(this.files);
			} else {
				QR.fileInput(null);
			}
		}).click(function(e) {
			if (e.shiftKey) {
				selectedreply.rmfile();
				e.preventDefault();
			}
		});

	function getFileSizeString(size) {
		if (size < 1024)
			return size + " B";
		if (size < 1048576)
			return (size/1024).toFixed(0) + " KB";
		return (size/1048576).toFixed(2) + " MB";
	}

	$(document).keydown(function(event) {
		if(!use_QR || event.ctrlKey || event.metaKey || event.altKey)
			return true;
		
		if(event.which == 27) {
			QR.close();
			return false;
		}
		
		if(/TEXTAREA|INPUT/.test(event.target.nodeName))
			return true;

		if((event.which == 81 && !event.shiftKey) ||
		   (event.which == 73 && event.shiftKey)) {
			QR.open();
			return false;
		}
	});

	var oldCiteReply = citeReply;
	function qrCiteReply(id) {
		QR.open();

		var cited = ">>"+id+"\n";

		if(typeof window.getSelection != "undefined" && window.getSelection != null) {
			var sel = window.getSelection();
			var startPostNo = $(sel.anchorNode).parents(".post").first().find(".intro:first>.post_no").last().text();
			var endPostNo = $(sel.focusNode).parents(".post").first().find(".intro:first>.post_no").last().text();
			if(id == startPostNo && id == endPostNo) {
				var text = sel.toString().trim();
				if(text.length) {
					var lines = text.split("\n");
					var hasStarted = false;
					for(var i in lines) {
						var line = lines[i].trim();
						if(!hasStarted && line == "")
							continue;
						hasStarted = true;
						cited += ">" + line + "\n";
					}
				}
			}
		}

		var text = $comment.val();
		if(typeof $comment[0].selectionStart != "undefined" && $comment[0].selectionStart != null) {
			var start = $comment[0].selectionStart;
			var end = $comment[0].selectionEnd;
			$comment.val(text.slice(0, start)+cited+text.slice(end));
			var afterInsert = start+cited.length;
			$comment[0].setSelectionRange(afterInsert, afterInsert);
		} else {
			$comment.val(text + cited);
		}
		$comment.focus();
		$comment.trigger("input");
	}

	function stealCaptcha() {
		$QRCaptchaPuzzleImage
			.css("visibility", "visible")
			.attr("src", $captchaPuzzle.find("img").attr("src"));
		$QRCaptchaChallengeField.val( $("#recaptcha_challenge_field").val() );
		$QRCaptchaAnswer.val("").prop("disabled", false);
	}

	function stealFormHiddenInputs(context) {
		$(".QRhiddenInputs", $QRForm).remove();

		$("input, textarea", context)
			.filter(function() {
				return !QRInputNames[$(this).attr("name")];
			})
			.clone()
			.addClass("QRhiddenInputs")
			.hide()
			.appendTo($QRForm);
	}
	stealFormHiddenInputs($oldForm);

	function QRrepair() {
		if($captchaPuzzle.length) {
			$QRCaptchaPuzzleImage.css("visibility", "hidden");
			$QRCaptchaAnswer.val("").prop("disabled", true);
			Recaptcha.reload();
		}
	}

	if($captchaPuzzle.length) {
		stealCaptcha();
		$("#recaptcha_image", $oldForm).on("DOMNodeInserted", function() {
			stealCaptcha();
		});
	}

	$QRCaptchaPuzzleDiv.click(function() {
		Recaptcha.reload();
	});

	function checkNameDisable() {
		if ($oldName.length == 0)
			$name.prop("disabled", true);
		if ($oldEmail.length == 0)
			$email.prop("disabled", true);
		if ($oldSubject.length == 0)
			$subject.prop("disabled", true);
	}
	checkNameDisable();

	if ($oldName.length == 0)
		$name.remove();
	if ($oldEmail.length == 0)
		$email.remove();
	if ($oldSubject.length == 0)
		$subject.remove();

	function setQRFormDisabled(disabled) {
		$("input, textarea", $QRForm).prop("disabled", disabled);
		if (!disabled)
			checkNameDisable();
	}

	var stickDistance = 10;

	var QRtopY;
	function setTopY() {
		if($(".boardlist.top").css("position")=="fixed") {
			QRtopY = $(".boardlist.top").height();
		} else {
			QRtopY = 0;
		}
	};
	setTopY();

	function positionQR(newX, newY) {
		if(newX < stickDistance) {
			$QR.css("left", 0).css("right", "");
		} else if(newX + $QR.width() > $(window).width() - stickDistance) {
			$QR.css("left", "").css("right", 0);
		} else {
			$QR.css("left", newX).css("right", "");
		}
		if(newY < stickDistance + QRtopY) {
			$QR.css("top", QRtopY).css("bottom", "").data('at top', true);
		} else if(newY + $QR.height() > $(window).height() - stickDistance) {
			$QR.css("top", "").css("bottom", 0).data('at top', false);
		} else {
			$QR.css("top", newY).css("bottom", "").data('at top', false);
		}
	}

	function loadQRposition() {
		setTopY();
		if(!window.localStorage || localStorage.qrX == null || localStorage.qrY == null)
			return false;
		var newX;
		if(localStorage.qrX == Infinity)
			newX = Infinity;
		else
			newX = parseInt(localStorage.qrX);
		var newY;
		if(localStorage.qrY == Infinity)
			newY = Infinity;
		else
			newY = parseInt(localStorage.qrY);
		positionQR(newX, newY);
	}

	function saveQRposition() {
		if (!window.localStorage) return;
		if($QR.css("right")=="0px")
			localStorage.qrX = Infinity;
		else
			localStorage.qrX = parseInt($QR.css("left"));

		if($QR.data('at top'))
			localStorage.qrY = 0;
		else if($QR.css("bottom")=="0px")
			localStorage.qrY = Infinity;
		else
			localStorage.qrY = parseInt($QR.css("top"));
	}

	$QRmove.mousedown(function(event) {
		if(event.which != 1)
			return;
		event.preventDefault();
		setTopY();
		var sLeft, sTop;
		function calibrateScroll() {
			sLeft = $(window).scrollLeft();
			sTop = $(window).scrollTop();
		}
		calibrateScroll();
		var startPos = $QR.position();
		var xoff = event.pageX - sLeft - startPos.left;
		var yoff = event.pageY - sTop - startPos.top;
		
		$(window).on("mousemove.qrmove", function(event) {
			var newX = event.pageX - sLeft - xoff;
			var newY = event.pageY - sTop - yoff;
			positionQR(newX, newY);
		}).on("scroll.qrmove", function(event) {
			calibrateScroll();
		}).on("mouseup.qrmove", function(event) {
			$(window).off(".qrmove");
			saveQRposition();
		});
	});
	
	$submit.click(function(event) {
		submitPost();
		event.preventDefault();
	});
	
	function submitPost() {
		if (query) {
			query.abort();
			query = null;
			return false;
		}
		
		if (!selectedreply.comment && !selectedreply.file && !$file.val()) {
			$QRwarning.text("Your post must have an image or a comment!");
			return false;
		}

		if ($captchaPuzzle.length && $QRCaptchaAnswer.val().trim().length == 0) {
			$QRwarning.text("You forgot to do the CAPTCHA!");
			return false;
		}
		
		if (window.localStorage) {
			if ($QRForm[0].elements['name'])
				localStorage.name = $QRForm[0].elements['name'].value.replace(/( |^)## .+$/, '');
			if ($QRForm[0].elements['email'] && $QRForm[0].elements['email'].value != 'sage')
				localStorage.email = $QRForm[0].elements['email'].value;
		}

		$password.val( $("form[name='postcontrols'] input#password").val() );
		
		$QRwarning.text("");

		if (useFormData) {
			try {
				var data = new FormData($QRForm[0]);
			} catch(e) {}
		}
		
		if (!data) {
			$QRForm.submit();
			return true;
		}
		
		data.append("post", $submit.val());
		data.append("wantjson", 1);
		if (selectedreply.file) {
			if (selectedreply.filethumb && !selectedreply.filethumb.isRejected() && !$spoiler.is(':checked')) {
				if (selectedreply.filethumb.isPending()) {
					if (selectedreply.filethumboktoskip) {
						// We already tried waiting. Give up on it.
						console.log('took too long to generate thumbnail; skipping');
						data.append('thumbtime', -1);
					} else {
						// thumbnail isn't generated yet, so let's wait until it's ready
						setQRFormDisabled(true);
						$submit.val("...").prop("disabled", false);
						var hasCancelled = false;
						query = {abort: function() {
							hasCancelled = true;
							query = null;
							prepSubmitButton();
							$QRwarning.text("Post discarded");
							setQRFormDisabled(false);
						}};
						selectedreply.filethumb.timeout(5000).fin(function() {
							if (hasCancelled)
								return;
							selectedreply.filethumboktoskip = true;
							query = null;
							prepSubmitButton();
							setQRFormDisabled(false);
							submitPost();
						});
						return false;
					}
				} else {
					var result = selectedreply.filethumb.valueOf();
					var filethumb = result[0];
					var thumb_timing = result[1];
					data.append('thumbtime', thumb_timing);
					
					if (filethumb.mozGetAsFile) {
						data.append('thumbfile', filethumb.mozGetAsFile('thumb.png', 'image/png'));
						console.log('thumbfile appended');
					} else {
						data.append('thumbdurl', filethumb.toDataURL('image/png'));
						console.log('thumbdurl appended');
					}
				}
			}
			if (!$file.val())
				data.append("file", selectedreply.file);
		}

		setQRFormDisabled(true);
		$submit.val("...").prop("disabled", false);
		
		var url = $QRForm.attr("action");
		query = $.ajax({
			url: url,
			data: data,
			cache: false,
			contentType: false,
			processData: false,
			type: 'POST',
			dataType: 'json',
			xhr: function() {
				var xhr = new window.XMLHttpRequest();
				if (typeof xhr.upload != "undefined" && xhr.upload) {
					xhr.upload.addEventListener("progress", function(e) {
						if (e.lengthComputable)
							$submit.val(Math.round(e.loaded * 100 / e.total).toString() + "%");
					}, false);
				}
				return xhr;
			},
			success: function(data) {
				query = null;
				setQRFormDisabled(false);
				if (data.status == 'success') {
					QRcooldown(10);
					if (settings.getSetting("QR_persistent") || (replies.length > 1))
						QR.clear();
					else
						QR.close();
					
					selectedreply.rm();
					
					$(document).trigger('post_submitted', {
						postid: data.postid,
						threadid: data.threadid,
						board: data.board,
						url: data.url
					});
					
					if (data.threadid == null) {
						window.location.href = data.url;
					} else {
						setTimeout(reloader.updateThreadNow, 10, true);
					}
				} else {
					if (data.error == 'message') {
						$QRwarning.text(data.message);
					} else if (data.error == 'ban') {
						var pageState = {title: 'Ban', banpage: data.banhtml};
						state.newState(pageState);
					} else {
						$QRwarning.text('Unknown error: '+data.error);
					}
					prepSubmitButton();
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				query = null;
				prepSubmitButton();
				$QRwarning.text(jqXHR.status == 0 && textStatus == "abort" ? "Post discarded" : "Connection error");
				setQRFormDisabled(false);
				var info = {xhrstatus: jqXHR.status, textStatus: textStatus, errorThrown: errorThrown};
				console.log("Ajax Error", info);
			}
		});

		QRrepair();

		return true;
	}

	function QRInit() {
		use_QR = settings.getSetting("use_QR");
		if (use_QR) {
			$oldForm.hide();
			$QRButtonDiv.show();
			citeReply = qrCiteReply;
			if($captchaPuzzle.length)
				stealCaptcha();
			if (settings.getSetting("QR_persistent"))
				QR.open();
		} else {
			QR.close();
			$oldForm.show();
			$QRButtonDiv.hide();
			citeReply = oldCiteReply;
		}
	}
	
	function init_flexstyle() {
		if (settings.getSetting("QR_flexstyle")) {
			$persona.addClass("useflexstyle");
		} else {
			$persona.removeClass("useflexstyle");
		}
	}
	init_flexstyle();

	QRInit();
	$(document).on("setting_change", function(e, setting) {
		if (setting == "use_QR")
			QRInit();
		else if (setting == "show_mature")
			init_mature_button();
		else if (setting == "QR_flexstyle")
			init_flexstyle();
	});
});
