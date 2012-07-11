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

	$("input[type='text'], textarea", $QRForm)
		.css("margin", "0px")
		.css("padding", "2px 4px 3px")
		.css("border", "1px solid black");


	$oldForm
		.find("input, textarea")
		.filter(":hidden")
		.clone()
		.appendTo($QRForm)
		.hide();

	// DOM setup over.

	var useQR = true;
	if(localStorage.useQR != null)
		useQR = (localStorage.useQR == "true");
	
	var saveSettings = function() {
		localStorage.useQR = useQR ? "true" : "false";
	}

	displayQR = function() {
		if($QR.is(":hidden")) {
			$QR.show();
		}
	};

	closeQR = function() {
		$QR.hide();
		$comment.val("");
	};

	$QRButton.click(function() {
		displayQR();
		return false;
	});

	$(document).keydown(function(event) {
		if(event.which == 27) {
			closeQR();
			return false;
		}

		if(/TEXTAREA|INPUT/.test(event.target.nodeName))
			return true;

		if(event.which == 73 && event.shiftKey) {
			displayQR();
			return false;
		}
	});

	var oldCiteReply = citeReply;
	var qrCiteReply = function(id) {
		displayQR();

		var body = document.getElementById('qrbody');
		
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
		body.focus();
	};


	var enable = function() {
		$oldForm.hide();
		$QRButton.show();
		citeReply = qrCiteReply;
	}

	var disable = function() {
		closeQR();
		$oldForm.show();
		$QRButton.hide();
		citeReply = oldCiteReply;
	}

	$QRToggleCheckbox
		.attr("checked", useQR)
		.change(function() {
			useQR = Boolean($(this).attr("checked"));
			if(useQR)
				enable();
			else
				disable();
			
			saveSettings();
		});

	if(useQR)
		enable();
	else
		disable();
});

