/*
 * qr.js
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/qr.js';
 *
 */

$(document).ready(function(){
	var $oldForm = $("form[name='post']");

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
		.css("padding", "2px 0")
		.css("min-width", "300px")
		.hide()
		.appendTo(document.body);
	$("<div/>")
		.text("Quick Reply")
		.appendTo($QR);
	var $QRForm = $("<form/>")
		.attr("id", "qrform")
		.attr("method", "post")
		.attr("action", $oldForm.attr("action") )
		.attr("enctype", "multipart/form-data")
		.css("margin", 0)
		.submit(function() {
			return dopost(this);
		})
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
		.attr("maxlength", 40)
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
	var $QRCaptchaAnswer = $("<input/>")
		.attr("id", "qrCaptchaAnswer")
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
		.appendTo($filerow);
	var $submit = $("<input/>")
		.attr("id", "qrsubmit")
		.attr("type", "submit")
		.attr("name", "post")
		.attr("accesskey", "s")
		.val( $oldForm.find("input[type='submit']").val() )
		.appendTo($filerow);
	var $spoilerrow = $("<div/>")
		.css("padding", "2px")
		.appendTo($QRForm);
	var $spoiler = $("<input/>")
		.attr("type", "checkbox")
		.attr("name", "spoiler")
		.attr("id", "qrspoiler");
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

	$("input[type='text'], textarea, #qrCaptchaPuzzle", $QRForm)
		.css("margin", "0px")
		.css("padding", "2px 4px 3px")
		.css("border", "1px solid rgb(128,128,128)");

	$oldForm
		.find("input, textarea")
		.filter(":hidden")
		.clone()
		.addClass("QRhiddenInputs")
		.appendTo($QRForm)
		.hide();

	// DOM setup over.

	settings.newProp("use_QR", "bool", false, "Use Quick Reply dialog for posting");
	settings.bindPropCheckbox($QRToggleCheckbox, "use_QR");

	var use_QR;

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
	};

	QR.close = function() {
		$QR.hide();
		$comment.val("");
	};

	$QRButton.click(function() {
		QR.open();
		return false;
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

		var body = document.getElementById('qrbody');
		
		body.focus();
		if (document.selection) {
			// IE
			var sel = document.selection.createRange();
			sel.text = '>>' + id + '\n';
		} else if (body.selectionStart || body.selectionStart == '0') {
			// Mozilla
			var start = body.selectionStart;
			var end = body.selectionEnd;
			body.value = body.value.substring(0, start) + '>>' + id + '\n' + body.value.substring(end, body.value.length);
		} else {
			// ???
			body.value += '>>' + id + '\n';
		}
	};

	var stealCaptcha = function() {
		$QRCaptchaPuzzleImage.attr("src", $captchaPuzzle.find("img").attr("src"));
		$("#recaptcha_challenge_field", $QRForm).val( $("#recaptcha_challenge_field", $oldForm).val() );
		$QRCaptchaAnswer.val("");
	}

	$("#recaptcha_image", $oldForm).on("DOMNodeInserted", function() {
		stealCaptcha();
	});

	$QRCaptchaPuzzleDiv.click(function() {
		Recaptcha.reload();
	});

	var QRInit = function() {
		use_QR = settings.getProp("use_QR", "bool");
		if (use_QR) {
			$oldForm.hide();
			$QRButton.show();
			citeReply = qrCiteReply;
			if($captchaPuzzle.length)
				stealCaptcha();
		} else {
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
