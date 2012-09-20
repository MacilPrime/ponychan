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
		.text("Quick Reply")
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
	
	var $QRForm = $("<form/>")
		.attr("id", "qrform")
		.attr("method", "post")
		.attr("action", $oldForm.attr("action") )
		.attr("enctype", "multipart/form-data")
		.appendTo($QR);
	var $namerow = $("<div/>").appendTo($QRForm);
	var $name = $("<input/>")
		.attr("id", "qrname")
		.attr("type", "text")
		.attr("name", "name")
		.attr("placeholder", "Name")
		.attr("maxlength", 75)
		.attr("size", 1)
		.val( $oldName.val() )
		.appendTo($namerow);
	var $email = $("<input/>")
		.attr("id", "qremail")
		.attr("type", "text")
		.attr("name", "email")
		.attr("placeholder", "Email")
		.attr("maxlength", 75)
		.attr("size", 1)
		.val( $oldEmail.val() )
		.appendTo($namerow);
	var $subject = $("<input/>")
		.attr("id", "qrsubject")
		.attr("type", "text")
		.attr("name", "subject")
		.attr("placeholder", "Subject")
		.attr("maxlength", 100)
		.attr("size", 1)
		.val( $oldSubject.val() )
		.appendTo($namerow);
	var $commentarea = $("<div/>").appendTo($QRForm);
	var $comment = $("<textarea/>")
		.attr("id", "qrbody")
		.attr("placeholder", "Comment")
		.attr("name", "body")
		.appendTo($commentarea);

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
	
	var $filerow = $("<div/>").appendTo($QRForm);
	var $file = $("<input/>")
		.attr("id", "qrfile")
		.attr("type", "file")
		.attr("name", "file")
		.attr("title", "Shift+Click to remove the selected file")
		.click(function(event) {
			if (event.shiftKey) {
				$(this).val("").change();
				event.preventDefault();
			}
		})
		.appendTo($filerow);
	var $submit = $("<input/>")
		.attr("id", "qrsubmit")
		.attr("type", "submit")
		.attr("name", "post")
		.attr("accesskey", "s")
		.appendTo($filerow);
	var $spoilerrow = $("<div/>")
		.css("padding", "2px")
		.appendTo($QRForm);
	var $spoiler = $("<input/>")
		.attr("type", "checkbox")
		.attr("name", "spoiler")
		.attr("id", "qrspoiler");
	var $imagepreview = $("<div/>")
		.attr("id", "qrimages")
		.click(function(event) {
			event.preventDefault();
			if (event.shiftKey) {
				$file.val("").change();
			} else {
				$file.click();
			}
		})
		.hide()
		.appendTo($QRForm);
	$("<label/>")
		.text("Spoiler Image")
		.attr("for", "qrspoiler")
		.prepend($spoiler)
		.appendTo($spoilerrow);

	if( $oldForm.find("#spoiler").length == 0 ) {
		$spoilerrow.hide();
	}

	var $password = $("<input/>")
		.attr("type", "hidden")
		.attr("name", "password")
		.val( $("form[name='postcontrols'] input#password").val() )
		.appendTo($QRForm);

	var $QRwarning = $("<div/>")
		.addClass("qrWarning")
		.click(function() {
			$QRwarning.text("");
		})
		.appendTo($QRForm);

	var QRInputNames = {};
	$("input, textarea", $QRForm).each(function() {
		var name = $(this).attr("name");
		if (name)
			QRInputNames[name] = true;
	});

	// DOM setup over.

	settings.bindPropCheckbox($QRToggleCheckbox, "use_QR");

	var use_QR;
	var QRcooldownTimer = 0;
	var QRrepairing = true;
	var query = null;
	var oldFormBad = false;

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
		if (query) {
			query.abort();
			query = null;
			QRrepair();
		}
	}

	QR.close = function() {
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
	
	var QRcooldown = function(time) {
		QRcooldownTimer = time;
		updateSubmitButton();
		if (time > 0) {
			setTimeout(QRcooldown, 1000, time-1);
		}
	};

	var updateSubmitButton = function() {
		if (QRcooldownTimer > 0) {
			$submit.val(QRcooldownTimer).prop("disabled", true);
		} else if (QRrepairing) {
			$submit.val("...").prop("disabled", true);
		} else {
			$submit.val( $oldForm.find("input[type='submit']").val() ).prop("disabled", false);
		}
	};

	var oldf = null;
	var usewURL = false;
	var wURL = window.URL || window.webkitURL;
	if(typeof wURL != "undefined" && wURL != null) {
		if(typeof wURL.createObjectURL != "undefined" && wURL.createObjectURL != null)
			usewURL = true;
	}
	
	var maxsize = $("input[name='file']", $oldForm).attr("data-max-filesize");
	
	$file.change(function() {
		if(!usewURL)
			return;

		var f = $file[0].files[0];
		
		if(f == null) {
			$imagepreview.css("background-image", "none").hide();
		} else {
			if (f.size > maxsize)
				return $QRwarning.text(f.name + " is too large");
			if (!/^image/.test(f.type))
				return $QRwarning.text("File " + f.name + " has an unsupported file extension");
			$imagepreview
				.css("background-image", "url(" + wURL.createObjectURL(f) + ")")
				.attr("title", f.name + " (" + getFileSizeString(f.size) + ")")
				.show();
		}
		if(oldf) {
			wURL.revokeObjectURL(oldf);
		}
		oldf = f;
	});
	
	var getFileSizeString = function(size) {
		if (size < 1024)
			return size + " B";
		if (size < 1048576)
			return (size/1024).toFixed(0) + " KB";
		return (size/1048576).toFixed(2) + " MB";
	}

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

		var $body = $('#qrbody');

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

		var text = $body.val();
		if(typeof $body[0].selectionStart != "undefined" && $body[0].selectionStart != null) {
			var start = $body[0].selectionStart;
			var end = $body[0].selectionEnd;
			$body.val(text.slice(0, start)+cited+text.slice(end));
			var afterInsert = start+cited.length;
			$body[0].setSelectionRange(afterInsert, afterInsert);
		} else {
			$body.val(text + cited);
		}
		$body.focus();
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

		QRrepairing = false;

		updateSubmitButton();
	};

	stealFormHiddenInputs($oldForm);

	var QRhiddenFieldRepair = function(newpage) {
		if (newpage == null)
			newpage = $("");

		var $thisBannerDiv = $("div.banner").first();
		var $newBannerDiv = $(newpage)
			.filter("div.banner")
			.add( $(newpage).find("div.banner") )
			.first();
		var $newForm = $(newpage)
			.filter("form[name='post']")
			.add( $(newpage).find("form[name='post']") )
			.first();

		if (($thisBannerDiv.length == $newBannerDiv.length) && $newForm.length) {
			stealFormHiddenInputs($newForm);
		} else {
			setTimeout(function() {
				$.ajax({
					url: document.location,
					success: function(data) {
						QRhiddenFieldRepair(data);
					},
					error: function(jqXHR, textStatus, errorThrown) {
						QRhiddenFieldRepair(null);
					}
				});
			}, 5000);
		}
	};

	var QRrepair = function(newpage) {
		oldFormBad = true;
		QRrepairing = true;
		updateSubmitButton();
		QRhiddenFieldRepair(newpage);

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

	if ($oldName.length == 0 && $oldEmail.length == 0) {
		if ($oldSubject.length == 0) {
			$namerow.hide();
		} else {
			$name.hide();
			$email.hide();
			$subject.css("width", "100%");
		}
	}

	var setQRFormDisabled = function(disabled) {
		$("input, textarea", $QRForm).prop("disabled", disabled);
		if (!disabled)
			checkNameDisable();
	}

	var positionQR = function(newX, newY) {
		var stickDistance = 10;
		var topY = 0;
		if($(".boardlist.top").css("position")=="fixed") {
			topY = $(".boardlist.top").height();
		}

		if(newX < stickDistance) {
			$QR.css("left", 0).css("right", "");
		} else if(newX + $QR.width() > $(window).width() - stickDistance) {
			$QR.css("left", "").css("right", 0);
		} else {
			$QR.css("left", newX).css("right", "");
		}
		if(newY < stickDistance + topY) {
			$QR.css("top", topY).css("bottom", "").data('at top', true);
		} else if(newY + $QR.height() > $(window).height() - stickDistance) {
			$QR.css("top", "").css("bottom", 0).data('at top', false);
		} else {
			$QR.css("top", newY).css("bottom", "").data('at top', false);
		}
	};

	var loadQRposition = function() {
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
		
		if (!dopost(this)) {
			$QRwarning.text("Your post must have an image or a comment!");
			return false;
		}

		if ($captchaPuzzle.length && $QRCaptchaAnswer.val().trim().length == 0) {
			$QRwarning.text("You forgot to do the CAPTCHA!");
			return false;
		}

		$QRwarning.text("");

		if (typeof FormData === "undefined" || FormData == null)
			return true;

		var data = new FormData(this);
		data.append("post", $submit.val());

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
				if (typeof xhr.upload != "undefined" && xhr.upload != null) {
					xhr.upload.addEventListener("progress", function(e) {
						if (e.lengthComputable)
							$submit.val(Math.round(e.loaded * 100 / e.total).toString() + "%");
					}, false);
				}
				return xhr;
			},
			success: function(data) {
				query = null;
				var title1 = $("h1", data).first().text().trim();
				if (title1 == "Error") {
					var title2 = $("h2", data).first().text().trim();
					$QRwarning.text(title2);
				} else if (title1 == "Banned!") {
					document.write(data);
					var newPageTitle = $("title", data).text();
					window.history.pushState({}, newPageTitle, url);
					return;
				} else {
					QRcooldown(10);
					if (settings.getProp("QR_persistent"))
						QR.clear();
					else
						QR.close();
				}

				if ($("div.banner").length == 0) {
					var newThreadNumber = parseInt($(".post.op .post_no", data).last().text());
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

				setQRFormDisabled(false);
				QRrepair(data);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				query = null;
				$QRwarning.text(jqXHR.status == 0 && textStatus == "abort" ? "Post discarded" : "Connection error");
				console.log("Ajax Error");
				console.log(errorThrown);
				setQRFormDisabled(false);
				QRrepair(data);
			}
		});
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
			if(oldFormBad)
				window.location.reload();

			QR.close();
			$oldForm.show();
			$QRButtonDiv.hide();
			citeReply = oldCiteReply;
		}
	}

	QRInit();
	$(document).on("setting_change", function(e, setting) {
		if (setting != "use_QR")
			return;
		QRInit();
	});
});
