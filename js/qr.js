/*
 * qr.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/qr.js';
 *
 */

$(document).ready(function(){
	settings.newProp("use_QR", "bool", false, "Use Quick Reply dialog for posting", "Lets you post without refreshing the page. Shift+I is the quick keyboard shortcut.");
	settings.newProp("QR_persistent", "bool", false, "Persistent QR (Don't close after posting)");

	var useFile = typeof FileReader != "undefined" && !!FileReader;
	var useFormData = typeof FormData != "undefined" && !!FormData;
	var usewURL = false;
	var wURL = window.URL || window.webkitURL;
	if(typeof wURL != "undefined" && wURL) {
		if(typeof wURL.createObjectURL != "undefined" && wURL.createObjectURL)
			usewURL = true;
	}
	
	var useQueuing = useFile && useFormData && usewURL;
	
	var $oldForm = $("form[name='post']");
	var $oldName = $oldForm.find("input[name='name']");
	var $oldEmail = $oldForm.find("input[name='email']");
	var $oldSubject = $oldForm.find("input[name='subject']");

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
	var $name = $("<input/>")
		.attr("id", "qrname")
		.attr("type", "text")
		.attr("name", "name")
		.attr("placeholder", "Name")
		.attr("maxlength", 75)
		.attr("size", 1)
		.val( $oldName.val() )
		.appendTo($QRForm);
	var $email = $("<input/>")
		.attr("id", "qremail")
		.attr("type", "text")
		.attr("name", "email")
		.attr("placeholder", "Email")
		.attr("maxlength", 75)
		.attr("size", 1)
		.val( $oldEmail.val() )
		.appendTo($QRForm);
	var $subject = $("<input/>")
		.attr("id", "qrsubject")
		.attr("type", "text")
		.attr("name", "subject")
		.attr("placeholder", "Subject")
		.attr("maxlength", 100)
		.attr("size", 1)
		.val( $oldSubject.val() )
		.appendTo($QRForm);
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
		$spoilerlabel.hide();
	}
	if( $oldForm.find("#raw").length == 0 ) {
		$rawhtmllabel.hide();
	}
	if( $oldForm.find("#lock").length == 0 ) {
		$locklabel.hide();
	}
	if( $oldForm.find("#sticky").length == 0 ) {
		$stickylabel.hide();
	}
	
	var QRInputNames = {};
	$("input, textarea", $QRForm).each(function() {
		var name = $(this).attr("name");
		if (name)
			QRInputNames[name] = true;
	});

	// DOM setup over.

	settings.bindPropCheckbox($QRToggleCheckbox, "use_QR");

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
	};

	QR.clear = function() {
		$comment.val("");
		$file.val("").change();
		$QRwarning.text("");
		$spoiler.attr("checked", false);
		$rawhtml.attr("checked", false);
		$lock.attr("checked", false);
		$sticky.attr("checked", false);
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
	};

	$QRButton.click(function() {
		QR.open();
		return false;
	});

	$QRCloseButton.click(function() {
		QR.close();
		return false;
	});
	
	var prepSubmitButton = function() {
		$submit.val( $oldForm.find("input[type='submit']").val() ).prop("disabled", false);
	};
	prepSubmitButton();
	
	var QRcooldown = function(time) {
		if (time > 0) {
			$submit.val(time).prop("disabled", true);
			setTimeout(QRcooldown, 1000, time-1);
		} else {
			prepSubmitButton();
			if ($auto.is(":checked") && (selectedreply.comment || selectedreply.file))
				$QRForm.submit();
		}
	};

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
			if (this.file != null)
				this.rmfile(true);
			this.file = file;
			this.el.attr("title", file.name + " (" + getFileSizeString(file.size) + ") (Shift+Click to remove image from reply)");
			if (usewURL) {
				this.fileurl = wURL.createObjectURL(file);
				this.el.css("background-image", "url(" + this.fileurl + ")");
			}
		}
		this.select = function() {
			$("#qrthumbselected").removeAttr("id");
			this.el.attr("id", "qrthumbselected");
			if (selectedreply != this) {
				if (!useFile || $file[0].files.length && this.file != $file[0].files[0])
					$file.val("");
			}
			selectedreply = this;
			$comment.val(selectedreply.comment)
				.off("input.selectedreply")
				.on("input.selectedreply", function() {
					selectedreply.comment = $comment.val();
				});
		}
		this.store = function() {
			this.comment = $comment.val();
		}
		this.rmfile = function(dontResetFileInput) {
			if (this.file != null) {
				if (usewURL && typeof wURL.revokeObjectURL != "undefined" && wURL.revokeObjectURL && this.fileurl) {
					wURL.revokeObjectURL(this.fileurl);
					delete this.fileurl;
				}
				delete this.file;
				this.el.css("background-image", "none")
					.attr("title", "");
			}
			if (!dontResetFileInput && selectedreply == this) {
				$file.val("");
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
			if (selectedreply == this)
				replies[0].select();
		}
	}
	
	var addReply = function() {
		selectedreply = new reply();
		selectedreply.select();
		replies.push(selectedreply);
	};
	
	var selectedreply = null;
	addReply();
	
	var maxsize = $("input[name='file']", $oldForm).attr("data-max-filesize");
	
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
				$file.val("");
				return;
			} else if ('type' in file && !/^image/.test(file.type)) {
				$QRwarning.text(file.name + " has an unsupported file type");
				$file.val("");
				return;
			}
			
			selectedreply.setfile(file);
			if (usewURL)
				$QRImagesWrapper.show();
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
		};
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

	var getFileSizeString = function(size) {
		if (size < 1024)
			return size + " B";
		if (size < 1048576)
			return (size/1024).toFixed(0) + " KB";
		return (size/1048576).toFixed(2) + " MB";
	};

	$(document).keydown(function(event) {
		if(event.which == 27) {
			QR.close();
			return false;
		}

		if(/TEXTAREA|INPUT/.test(event.target.nodeName))
			return true;

		if(event.which == 73 && event.shiftKey && use_QR) {
			QR.open();
			return false;
		}
	});

	var oldCiteReply = citeReply;
	var qrCiteReply = function(id) {
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
	};

	var stealCaptcha = function() {
		$QRCaptchaPuzzleImage
			.css("visibility", "visible")
			.attr("src", $captchaPuzzle.find("img").attr("src"));
		$QRCaptchaChallengeField.val( $("#recaptcha_challenge_field").val() );
		$QRCaptchaAnswer.val("").prop("disabled", false);
	};

	var stealFormHiddenInputs = function(context) {
		$(".QRhiddenInputs", $QRForm).remove();

		$("input, textarea", context)
			.filter(function() {
				return !QRInputNames[$(this).attr("name")];
			})
			.clone()
			.addClass("QRhiddenInputs")
			.hide()
			.appendTo($QRForm);
	};
	stealFormHiddenInputs($oldForm);

	var QRrepair = function() {
		if($captchaPuzzle.length) {
			$QRCaptchaPuzzleImage.css("visibility", "hidden");
			$QRCaptchaAnswer.val("").prop("disabled", true);
			Recaptcha.reload();
		}
	};

	if($captchaPuzzle.length) {
		stealCaptcha();
		$("#recaptcha_image", $oldForm).on("DOMNodeInserted", function() {
			stealCaptcha();
		});
	}

	$QRCaptchaPuzzleDiv.click(function() {
		Recaptcha.reload();
	});

	var checkNameDisable = function() {
		if ($oldName.length == 0)
			$name.prop("disabled", true);
		if ($oldEmail.length == 0)
			$email.prop("disabled", true);
		if ($oldSubject.length == 0)
			$subject.prop("disabled", true);
	};
	checkNameDisable();

	if ($oldName.length == 0)
		$name.hide();
	if ($oldEmail.length == 0)
		$email.hide();
	if ($oldSubject.length == 0)
		$subject.hide();

	var setQRFormDisabled = function(disabled) {
		$("input, textarea", $QRForm).prop("disabled", disabled);
		if (!disabled)
			checkNameDisable();
	};

	var stickDistance = 10;

	var QRtopY;
	var setTopY = function() {
		if($(".boardlist.top").css("position")=="fixed") {
			QRtopY = $(".boardlist.top").height();
		} else {
			QRtopY = 0;
		}
	};
	setTopY();

	var positionQR = function(newX, newY) {
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
	};

	var loadQRposition = function() {
		setTopY();
		if(localStorage.qrX == null || localStorage.qrY == null)
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
	};

	var saveQRposition = function() {
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
	};

	$QRmove.mousedown(function(event) {
		if(event.which != 1)
			return;
		event.preventDefault();
		setTopY();
		var startPos = $QR.position();
		var xoff = event.pageX - startPos.left;
		var yoff = event.pageY - startPos.top;
		$(window).on("mousemove.qr", function(event) {
			var newX = event.clientX - xoff;
			var newY = event.clientY - yoff;
			positionQR(newX, newY);
		}).on("mouseup.qr", function(event) {
			$(window).off("mousemove.qr").off("mouseup.qr");
			saveQRposition();
		});
	});
	
	$QRForm.submit(function(event) {
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

		if (this.elements['name']) {
			localStorage.name = this.elements['name'].value.replace(/ ##.+$/, '');
		}
		if (this.elements['email'] && this.elements['email'].value != 'sage') {
			localStorage.email = this.elements['email'].value;
		}
		
		$QRwarning.text("");

		if (!useFormData)
			return true;

		var data = new FormData(this);
		data.append("post", $submit.val());
		if (selectedreply.file)
			data.append("file", selectedreply.file);

		setQRFormDisabled(true);
		$submit.val("...").prop("disabled", false);
		
		var url = $(this).attr("action");
		query = $.ajax({
			url: url,
			data: data,
			cache: false,
			contentType: false,
			processData: false,
			type: 'POST',
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
				var title1 = $("h1", data).first().text().trim();
				if (title1 == "Error") {
					var title2 = $("h2", data).first().text().trim();
					$QRwarning.text(title2);
					prepSubmitButton();
				} else if (title1 == "Banned!") {
					document.write(data);
					var newPageTitle = $("title", data).text();
					window.history.pushState({}, newPageTitle, url);
					return;
				} else {
					QRcooldown(10);
					if (settings.getProp("QR_persistent") || (replies.length > 1))
						QR.clear();
					else
						QR.close();

					selectedreply.rm();
				}

				if ($("div.banner").length == 0) {
					var newThreadNumber = parseInt(/reply_(\d+)/.exec($(".post.op", data).first().attr("id"))[1]);
					if (isNaN(newThreadNumber)) {
						console.error("Could not read new thread number!");
					} else {
						var newThreadURL = /^.*\//.exec(document.location) + "res/"+newThreadNumber+".html";
						window.location.href = newThreadURL;
					}
				} else {
					var $newBannerDiv = $(data)
						.filter("div.banner")
						.add( $(data).find("div.banner") )
						.first();

					if ($newBannerDiv.length) {
						updateThreadNowWithData(data);
					} else {
						setTimeout(updateThreadNow, 1000);
					}
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				query = null;
				prepSubmitButton();
				$QRwarning.text(jqXHR.status == 0 && textStatus == "abort" ? "Post discarded" : "Connection error");
				console.log("Ajax Error");
				console.log(errorThrown);
				setQRFormDisabled(false);
			}
		});

		QRrepair();

		return false;
	});

	var QRInit = function() {
		use_QR = settings.getProp("use_QR");
		if (use_QR) {
			$oldForm.hide();
			$QRButtonDiv.show();
			citeReply = qrCiteReply;
			if($captchaPuzzle.length)
				stealCaptcha();
			if (settings.getProp("QR_persistent"))
				QR.open();
		} else {
			QR.close();
			$oldForm.show();
			$QRButtonDiv.hide();
			citeReply = oldCiteReply;
		}
	};

	QRInit();
	$(document).on("setting_change", function(e, setting) {
		if (setting != "use_QR")
			return;
		QRInit();
	});
});
