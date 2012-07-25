/*
 * qr.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/qr.js';
 *
 */

$(document).ready(function(){
	settings.newProp("use_QR", "bool", false, "Use Quick Reply dialog for posting");
	settings.newProp("QR_persistent", "bool", false, "Persistent QR (Don't close after posting)");

	var $oldForm = $("form[name='post']");

	if ($oldForm.length == 0)
		return;

	var $QRToggleOptions = $("<div/>")
		.css("text-align", "center")
		.insertBefore($oldForm);

	var $QRToggleLabel = $("<label/>")
		.text(" Use Quick Reply dialog")
		.attr("for", "qrtogglebox")
		.appendTo($QRToggleOptions);
	
	var $QRToggleCheckbox = $("<input/>")
		.attr("id", "qrtogglebox")
		.attr("type", "checkbox")
		.prependTo($QRToggleLabel);

	var $QRButtonDiv = $("<div/>").appendTo($QRToggleOptions);
	var $QRButton = $("<a/>")
		.attr("id", "qrDisplayButton")
		.attr("href", "javascript:;")
		.css("color", "red")
		.css("font-size", "150%")
		.text("Open the Quick Reply dialog")
		.appendTo($QRButtonDiv);

	var $QR = $("<div/>")
		.css("position", "fixed")
		.attr("id", "qr")
		.css("background-color", "grey")
		.css("top", 0)
		.css("right", 0)
		.css("left", "")
		.css("bottom", "")
		.css("padding", "2px 0")
		.css("min-width", "300px")
		.hide()
		.data('at top', true)
		.appendTo(document.body);

	var $QRmove = $("<div/>")
		.text("Quick Reply")
		.css("cursor", "move")
		.css("padding", "2px")
		.appendTo($QR);
	var $QRCloseButton = $("<a/>")
		.attr("href", "javascript:;")
		.text("X")
		.css("float", "right")
		.css("color", "blue")
		.css("text-decoration", "none")
		.css("margin", "0 3px")
		.appendTo($QRmove);

	var $QRForm = $("<form/>")
		.attr("id", "qrform")
		.attr("method", "post")
		.attr("action", $oldForm.attr("action") )
		.attr("enctype", "multipart/form-data")
		.css("margin", 0)
		.appendTo($QR);
	var $namerow = $("<div/>").appendTo($QRForm);
	var $name = $("<input/>")
		.attr("id", "qrname")
		.attr("type", "text")
		.attr("name", "name")
		.attr("placeholder", "Name")
		.attr("maxlength", 50)
		.css("box-sizing", "border-box")
		.css("-moz-box-sizing", "border-box")
		.css("width", "33%")
		.attr("size", 1)
		.val( $oldForm.find("input[name='name']").val() )
		.appendTo($namerow);
	var $email = $("<input/>")
		.attr("id", "qremail")
		.attr("type", "text")
		.attr("name", "email")
		.attr("placeholder", "Email")
		.attr("maxlength", 75)
		.css("box-sizing", "border-box")
		.css("-moz-box-sizing", "border-box")
		.css("width", "33%")
		.attr("size", 1)
		.val( $oldForm.find("input[name='email']").val() )
		.appendTo($namerow);
	var $subject = $("<input/>")
		.attr("id", "qrsubject")
		.attr("type", "text")
		.attr("name", "subject")
		.attr("placeholder", "Subject")
		.attr("maxlength", 100)
		.css("box-sizing", "border-box")
		.css("-moz-box-sizing", "border-box")
		.attr("size", 1)
		.css("width", "34%")
		.val( $oldForm.find("input[name='subject']").val() )
		.appendTo($namerow);
	var $commentarea = $("<div/>").appendTo($QRForm);
	var $comment = $("<textarea/>")
		.attr("id", "qrbody")
		.attr("placeholder", "Comment")
		.attr("name", "body")
		.css("margin", 0)
		.css("box-sizing", "border-box")
		.css("-moz-box-sizing", "border-box")
		.css("min-height", "120px")
		.css("min-width", "100%")
		.appendTo($commentarea);

	var $QRCaptchaDiv = $("<div/>")
		.appendTo($QRForm);
	var $QRCaptchaPuzzleDiv = $("<div/>")
		.attr("id", "qrCaptchaPuzzle")
		.css("background", "rgb(255,255,255)")
		.css("width", "100%")
		.attr("title", "Reload CAPTCHA")
		.appendTo($QRCaptchaDiv);
	var $QRCaptchaPuzzleImage = $("<img/>")
		.css("width", "300px")
		.css("height", "57px")
		.css("margin", "0px")
		.css("padding", "0px")
		.css("float", "none")
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
		.css("box-sizing", "border-box")
		.css("-moz-box-sizing", "border-box")
		.attr("size", 1)
		.css("width", "100%")
		.appendTo($QRCaptchaAnswerDiv);

	var $captchaPuzzle = $("#recaptcha_image");
	if($captchaPuzzle.length == 0)
		$QRCaptchaDiv.hide();
	
	var $filerow = $("<div/>").appendTo($QRForm);
	var $file = $("<input/>")
		.attr("id", "qrfile")
		.attr("type", "file")
		.attr("name", "file")
		.css("width", "70%")
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
		.css("width", "30%")
		.appendTo($filerow);
	var $spoilerrow = $("<div/>")
		.css("padding", "2px")
		.appendTo($QRForm);
	var $spoiler = $("<input/>")
		.attr("type", "checkbox")
		.attr("name", "spoiler")
		.attr("id", "qrspoiler");
	var $imagepreview = $("<div/>")
		.css("border", "1px solid black")
		.css("width", "70px")
		.css("height", "70px")
		.css("margin-left", "3px")
		.css("background-size", "cover")
		.css("cursor", "pointer")
		.click(function(event) {
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

	if( $oldForm.find("#spoiler").filter(":visible").length == 0 ) {
		$spoilerrow.hide();
	}

	var $password = $("<input/>")
		.attr("type", "hidden")
		.attr("name", "password")
		.val( $("form[name='postcontrols'] input#password").val() )
		.appendTo($QRForm);

	var $QRwarning = $("<div/>")
		.addClass("qrWarning")
		.css("color", "red")
		.appendTo($QRForm);

	$("input[type='text'], textarea, #qrCaptchaPuzzle", $QRForm)
		.css("margin", "0px")
		.css("padding", "2px 4px 3px")
		.css("border", "1px solid rgb(128,128,128)");

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
		if(!hasLoadedPos) {
			loadQRposition();
		}
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
	
	var oldf = null;
	var usewURL = false;
	var wURL = window.URL || window.webkitURL;
	if(typeof wURL != "undefined" && wURL != null) {
		if(typeof wURL.createObjectURL != "undefined" && wURL.createObjectURL != null)
			usewURL = true;
	}

	$file.change(function() {
		if(!usewURL)
			return;

		var f = $file[0].files[0];
		if(f == null) {
			$imagepreview.css("background-image", "none").hide();
		} else {
			$imagepreview
				.css("background-image", "url(" + (window.URL || window.webkitURL).createObjectURL(f) + ")")
				.attr("title", f.name + " (" + (f.size/1024).toFixed(0) + " KB)")
				.show();
		}
		if(oldf) {
			wURL.revokeObjectURL(oldf);
		}
		oldf = f;
	});

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

		var body = $('#qrbody');

		var cited = ">>"+id+"\n";

		if(typeof window.getSelection != "undefined" && window.getSelection != null) {
			var sel = window.getSelection();
			var startPostNo = $(sel.anchorNode).parents(".post").first().find(">.intro>.post_no").last().text();
			var endPostNo = $(sel.focusNode).parents(".post").first().find(">.intro>.post_no").last().text();
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

		body.val( body.val() + cited );
		body.focus();
	};

	var fixSubmitButton = function() {
		$submit.val( $oldForm.find("input[type='submit']").val() ).prop("disabled", false);
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

		fixSubmitButton();
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
		$submit.val("...").prop("disabled", true);
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

	var setQRFormDisabled = function(disabled) {
		$("input, textarea", $QRForm).prop("disabled", disabled);
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

	var hasLoadedPos = false;
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

		$submit.val("Sending...");
		setQRFormDisabled(true);

		var url = $(this).attr("action");
		query = $.ajax({
			url: url,
			data: data,
			cache: false,
			contentType: false,
			processData: false,
			type: 'POST',
			success: function(data) {
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
				$QRwarning.text("Connection Error");
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
			$QRButton.show();
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
			$QRButton.hide();
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
