/*
 * qr.js
 *
 * Released under the MIT license
 * Copyright (c) 2014 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import RSVP from 'rsvp';

import settings from './settings';
import {updateThreadNow} from './legacy/reloader';
import {thumbnailer_simple} from './thumbnailer';

import * as state from './state';

settings.newSetting('use_QR', 'bool', false, 'Use Quick Reply dialog for posting', 'posting', {moredetails:'Lets you post without refreshing the page. Q is the quick keyboard shortcut.', orderhint:1});
settings.newSetting('QR_persistent', 'bool', false, "Persistent QR (Don't close after posting)", 'posting', {orderhint:2});
settings.newSetting(
  'QR_flexstyle', 'bool', true, 'Use small persona fields on QR', 'posting',
  {
    orderhint:3,
    notSupported: !(window.CSS && CSS.supports && CSS.supports('display','flex'))
  }
);

$(document).ready(function() {
  const useFile = typeof FileReader != 'undefined' && !!FileReader;
  const useFormData = typeof FormData != 'undefined' && !!FormData;
  const useCanvas = !!window.HTMLCanvasElement;
  const useWorker = !!window.Worker;
  let usewURL = false;
  const wURL = window.URL || window.webkitURL;
  if (typeof wURL != 'undefined' && wURL) {
    if (typeof wURL.createObjectURL != 'undefined' && wURL.createObjectURL)
      usewURL = true;
  }

  const useQueuing = useFile && useFormData && usewURL;

  const $oldForm = $("form[name='post']");
  const $oldName = $oldForm.find("input[name='name']");
  const $oldEmail = $oldForm.find("input[name='email']");
  const $oldSubject = $oldForm.find("input[name='subject']");
  const $oldFile = $oldForm.find("input[name='file']");

  if ($oldForm.length == 0)
    return;

  /* eslint-disable no-unused-vars */
  $('#qrtoggleoptions').remove();
  const $QRToggleOptions = $('<div/>')
    .attr('id', 'qrtoggleoptions')
    .insertBefore($oldForm);

  const $QRToggleLabel = $('<label/>')
    .text(' Use Quick Reply dialog')
    .attr('for', 'qrtogglebox')
    .appendTo($QRToggleOptions);

  const $QRToggleCheckbox = $('<input/>')
    .attr('id', 'qrtogglebox')
    .attr('type', 'checkbox')
    .prependTo($QRToggleLabel);

  const $QRButtonDiv = $('<div/>')
    .attr('id', 'qrDisplayButtonDiv')
    .appendTo($QRToggleOptions);
  const $QRButton = $('<a/>')
    .attr('id', 'qrDisplayButton')
    .attr('href', 'javascript:;')
    .text('Open the Quick Reply dialog')
    .appendTo($QRButtonDiv);

  $('#qr').remove();

  const $QR = $('<div/>')
    .attr('id', 'qr')
    .css('top', 0)
    .css('right', 0)
    .css('left', '')
    .css('bottom', '')
    .hide()
    .data('at top', true)
    .appendTo(document.body);
  const $QRmove = $('<div/>')
    .attr('id', 'qrmove')
    .appendTo($QR);
  const $QRCloseButton = $('<a/>')
    .attr('href', 'javascript:;')
    .text('X')
    .appendTo($QRmove);
  const $QRUpButton = $('<a/>')
    .attr('href', '#')
    .text('▲')
    .appendTo($QRmove);
  const $QRDownButton = $('<a/>')
    .attr('href', 'javascript:;')
    .text('▼')
    .click(() => {
      window.scrollTo(0, document.body.scrollHeight);
    })
    .appendTo($QRmove);
  const $QRImagesWrapper = $('<div/>')
    .attr('id', 'qrimageswrapper')
    .hide()
    .appendTo($QR);
  const $QRImages = $('<div/>')
    .attr('id', 'qrimages')
    .appendTo($QRImagesWrapper);
  const $QRAddImageButton = $('<a/>')
    .attr('id', 'qraddimage')
    .attr('href', 'javascript:;')
    .attr('title', 'Add reply')
    .text('+')
    .click(function() {
      if (!query) {
        $QRImagesWrapper.show();
        addReply();
      }
    })
    .appendTo($QRImages);
  const $QRToggleImagesButton = $('<a/>')
    .attr('href', 'javascript:;')
    .attr('title', 'Toggle reply queue')
    .text('+')
    .click(function() {
      $QRImagesWrapper.toggle();
    })
    .appendTo($QRmove);
  const $QRForm = $('<form/>')
    .attr('id', 'qrform')
    .attr('method', 'post')
    .attr('action', $oldForm.attr('action') )
    .attr('enctype', 'multipart/form-data')
    .appendTo($QR);

  const $persona = $('<div/>')
    .attr('id', 'qrpersona')
    .appendTo($QRForm);

  const $name = $('<input/>')
    .attr('id', 'qrname')
    .attr('type', 'text')
    .attr('name', 'name')
    .attr('placeholder', 'Name')
    .attr('maxlength', 75)
    .attr('size', 1)
    .val( $oldName.val() )
    .appendTo($persona);
  const $email = $('<input/>')
    .attr('id', 'qremail')
    .attr('type', 'text')
    .attr('name', 'email')
    .attr('placeholder', 'Email')
    .attr('maxlength', 254)
    .attr('size', 1)
    .val( $oldEmail.val() )
    .appendTo($persona);
  const $subject = $('<input/>')
    .attr('id', 'qrsubject')
    .attr('type', 'text')
    .attr('name', 'subject')
    .attr('placeholder', 'Subject')
    .attr('maxlength', 100)
    .attr('size', 1)
    .val( $oldSubject.val() )
    .appendTo($persona);
  const $comment = $('<textarea/>')
    .attr('id', 'qrcomment')
    .attr('placeholder', 'Comment')
    .attr('name', 'body')
    .appendTo($QRForm);
  const $QRCaptchaDiv = $('<div/>')
    .appendTo($QRForm);
  const $QRCaptchaPuzzleDiv = $('<div/>')
    .attr('id', 'qrCaptchaPuzzle')
    .attr('title', 'Reload CAPTCHA')
    .appendTo($QRCaptchaDiv);
  const $QRCaptchaPuzzleImage = $('<img/>')
    .appendTo($QRCaptchaPuzzleDiv);
  const $QRCaptchaAnswerDiv = $('<div/>').appendTo($QRCaptchaDiv);
  const $QRCaptchaChallengeField = $('<input/>')
    .attr('id', 'qrCaptchaChallenge')
    .attr('name', 'recaptcha_challenge_field')
    .attr('type', 'hidden')
    .appendTo($QRCaptchaAnswerDiv);
  const $QRCaptchaAnswer = $('<input/>')
    .attr('id', 'qrCaptchaAnswer')
    .attr('type', 'text')
    .attr('placeholder', 'Verification')
    .attr('name', 'recaptcha_response_field')
    .attr('size', 1)
    .appendTo($QRCaptchaAnswerDiv);
  const $captchaPuzzle = $('#recaptcha_image');
  if ($captchaPuzzle.length == 0)
    $QRCaptchaDiv.hide();
  const $buttonrow = $('<div/>')
    .attr('id', 'qrbuttonrow')
    .appendTo($QRForm);
  let $file = $('<input/>')
    .attr('id', 'qrfile')
    .attr('type', 'file')
    .attr('name', 'file')
    .attr('accept', 'image/*,video/webm')
    .appendTo($buttonrow);
  const $filebutton = $('<button/>')
    .attr('id', 'qrfilebutton')
    .attr('type', 'button')
    .text('Browse...')
    .click(function(e) {
      e.preventDefault();
      $file.click();
    })
    .appendTo($buttonrow);
  const $fileRemove = $('<button />')
    .html('&#10006;')
    .attr('title', 'Remove image from reply')
    .attr('id', 'qrfileremove')
    .appendTo($buttonrow);
  const $submit = $('<input/>')
    .attr('id', 'qrsubmit')
    .attr('type', 'submit')
    .attr('name', 'post')
    .attr('title', 'Post (Ctrl-Enter)')
    .appendTo($buttonrow);
  const $row = $('<div/>')
    .attr('class', 'qr-options')
    .css('min-width', '100%')
    .appendTo($QRForm);
  const $spoiler_thread = $('<input/>')
    .attr('id', 'qrspoiler_thread')
    .attr('type', 'checkbox')
    .attr('name', 'spoiler_thread');
  const $spoiler_thread_label = $('<label/>')
    .text('Spoiler Thread')
    .attr('for', 'qrspoiler_thread')
    .prepend($spoiler_thread)
    .appendTo($row);
  const $spoiler = $('<input/>')
    .attr('id', 'qrspoiler')
    .attr('type', 'checkbox')
    .attr('name', 'spoiler');
  const $spoilerlabel = $('<label/>')
    .text('Spoiler Image')
    .attr('for', 'qrspoiler')
    .prepend($spoiler)
    .appendTo($row);
  const $mature = $('<input/>')
    .attr('id', 'qrmature')
    .attr('type', 'checkbox')
    .attr('name', 'mature');
  const $maturelabel = $('<label/>')
    .text('Mature Content')
    .attr('id', 'qrmaturelabel')
    .attr('for', 'qrmature')
    .prepend($mature)
    .appendTo($row);
  const $auto = $('<input/>')
    .attr('id', 'qrauto')
    .attr('type', 'checkbox');
  const $autolabel = $('<label/>')
    .text('Auto Mode')
    .attr('title', 'Automatically post the next reply in queue')
    .attr('for', 'qrauto')
    .prepend($auto)
    .appendTo($row);
  const $modrow = $('<div/>')
    .attr('class', 'qr-options')
    .css('min-width', '100%')
    .appendTo($QRForm);
  const $sticky = $('<input/>')
    .attr('id', 'qrsticky')
    .attr('type', 'checkbox')
    .attr('name', 'sticky');
  const $stickylabel = $('<label/>')
    .text('Sticky')
    .attr('for', 'qrsticky')
    .prepend($sticky)
    .appendTo($modrow);
  const $lock = $('<input/>')
    .attr('id', 'qrlock')
    .attr('type', 'checkbox')
    .attr('name', 'lock');
  const $locklabel = $('<label/>')
    .text('Lock')
    .attr('for', 'qrlock')
    .prepend($lock)
    .appendTo($modrow);
  const $rawhtml = $('<input/>')
    .attr('id', 'qrraw')
    .attr('type', 'checkbox')
    .attr('name', 'raw');
  const $rawhtmllabel = $('<label/>')
    .text('Raw HTML')
    .attr('for', 'qrraw')
    .prepend($rawhtml)
    .appendTo($modrow);
  const $use_capcode = $('<input/>')
    .attr('id', 'qr_use_capcode')
    .attr('type', 'checkbox')
    .attr('name', 'use_capcode');
  const $use_capcode_label = $('<label/>')
    .attr('for', 'qr_use_capcode')
    .prepend($use_capcode)
    .appendTo($modrow);
  const $QRwarning = $('<div/>')
    .attr('id', 'qrwarning')
    .click(function() {
      $QRwarning.text('');
    })
    .appendTo($QRForm);
  const $password = $('<input/>')
    .attr('type', 'hidden')
    .attr('name', 'password')
    .val( $("form[name='postcontrols'] input#password").val() )
    .appendTo($QRForm);
  {
    const $old_use_capcode = $oldForm.find('#use_capcode');
    if ($old_use_capcode.length) {
      $use_capcode_label.append($old_use_capcode.parent().find('.textPart').clone());
    } else {
      $use_capcode_label.remove();
    }
  }
  if ( $oldForm.find('#spoiler_thread').length == 0 ) {
    $spoiler_thread_label.remove();
  }
  if ( $oldForm.find('#spoiler').length == 0 ) {
    $spoilerlabel.remove();
  }
  if ( $oldForm.find('#raw').length == 0 ) {
    $rawhtmllabel.remove();
  }
  if ( $oldForm.find('#lock').length == 0 ) {
    $locklabel.remove();
  }
  if ( $oldForm.find('#sticky').length == 0 ) {
    $stickylabel.remove();
  }
  function init_mature_button() {
    if ( $oldForm.find('#mature').length == 0 || !settings.getSetting('show_mature') )
      $maturelabel.hide();
    else
      $maturelabel.show();
  }
  init_mature_button();

  $QR.keypress(e => {
    if (
      !$submit.prop('disabled') &&
      (e.key === 'Enter' || e.which === 10 || e.which === 13) &&
      (e.ctrlKey || e.metaKey)
    ) {
      $submit.click();
    }
  });

  let QRInputNames = {};
  $('input, textarea', $QRForm).each(function() {
    const name = $(this).attr('name');
    if (name)
      QRInputNames[name] = true;
  });

  // DOM setup over.
  /* eslint-enable no-unused-vars */

  settings.bindCheckbox($QRToggleCheckbox, 'use_QR');

  function resetFileInput() {
    if (/MSIE/.test(navigator.userAgent)) {
      const $newFile = $file.clone(true);
      $file.replaceWith($newFile);
      $file = $newFile;
    } else {
      $file.val('');
    }
  }

  let use_QR;
  let query = null;

  // TODO don't be global
  const QR = window.QR = {};

  QR.isEnabled = function() {
    return use_QR;
  };

  QR.open = function() {
    if (!use_QR) {
      console.error('QR.open called when use_QR was false'); //eslint-disable-line no-console
      return;
    }
    if ($QR.is(':hidden')) {
      $QR.show();
    }
    loadQRposition();
    if ($QR.data('at top')) {
      if ($('.boardlist.top').css('position')=='fixed') {
        $QR.css('top', $('.boardlist.top').height());
      } else {
        $QR.css('top', 0);
      }
    }
    $('head meta[name=viewport]').remove();
    $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">');
  };

  QR.clear = function() {
    $comment.val('');
    $subject.val('');
    resetFileInput();
    $file.change();
    $QRwarning.text('');
    $spoiler.prop('checked', false);
    $rawhtml.prop('checked', false);
    $lock.prop('checked', false);
    $sticky.prop('checked', false);
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
    $submit.val( $oldForm.find("input[type='submit']").val() ).prop('disabled', false);
  }
  prepSubmitButton();

  function QRcooldown(time) {
    if (time > 0) {
      $submit.val(time).prop('disabled', true);
      setTimeout(QRcooldown, 1000, time-1);
    } else {
      prepSubmitButton();
      if ($auto.is(':checked') && (selectedreply.comment || selectedreply.file))
        submitPost();
    }
  }

  if (!usewURL) {
    $QRToggleImagesButton.hide();
  }

  let replies = [];
  function reply() {
    this.file = null;
    this.fileurl = null;
    this.comment = '';
    this.el = $('<div/>')
      .attr('class', 'qrthumb')
      .click(e => {
        e.preventDefault();
        if (!query) {
          if (e.shiftKey) {
            this.rmfile();
          } else {
            this.select();
          }
        }
      })
      .insertBefore($QRAddImageButton);
    $('<a/>')
      .attr('class', 'qrremovethumb')
      .attr('title', 'Remove reply')
      .text('x')
      .click(e => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.shiftKey && !query)
          this.rm();
      })
      .appendTo(this.el);
    this.setfile = function(file) {
      const _this = this;

      if (this.file != null)
        this.rmfile(true);
      this.file = file;
      this.el.attr('title', file.name + ' (' + getFileSizeString(file.size) + ') (Shift+Click to remove image from reply)');
      if (usewURL) {
        this.fileurl = wURL.createObjectURL(file);

        if (file.type && /^video\//.test(file.type)) {
          const video = document.createElement('video');
          if (video.canPlayType && video.canPlayType(file.type)) {
            video.muted = true;
            video.src = this.fileurl;
            video.addEventListener('playing', function() {
              video.pause();
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth; //|| 100;
              canvas.height = video.videoHeight; //|| 100;
              const context = canvas.getContext('2d');
              context.fillRect(0, 0, canvas.width, canvas.height);
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              video.removeAttribute('src');
              _this.el.css('background-image', 'url(' + canvas.toDataURL('image/png') + ')');
            });
            video.play();
          }
        } else {
          this.el.css('background-image', 'url(' + this.fileurl + ')');
          if (useCanvas && useWorker) {
            const render_job = RSVP.defer();

            const fileimg = new Image();
            fileimg.onload = function() {
              const maxX = parseInt($oldFile.attr('data-thumb-max-width'));
              const maxY = parseInt($oldFile.attr('data-thumb-max-height'));

              if (fileimg.width <= maxX && fileimg.height <= maxY) {
                return;
              }

              const start = new Date().getTime();
              const thumber = thumbnailer_simple(fileimg, maxX, maxY);
              const thumber_timing = thumber.then(function() {
                const end = new Date().getTime();
                const time = end-start;
                console.log(`thumbnailing took ${time} milliseconds`); //eslint-disable-line no-console
                return time;
              });
              render_job.resolve(RSVP.all([thumber, thumber_timing]));

              // If the original image was really big, then replace the image preview
              // in the QR with the thumbnail we just made.
              // Some browsers (webkit) lag when too big of an image is there.
              if (this.width >= 1000 || this.height >= 1000) {
                thumber.then(function(filethumb) {
                // If the image has already been changed by the user, we don't want to replace the wrong thumbnail.
                  if (_this.file === file) {
                    _this.el.css('background-image', 'url("' + filethumb.toDataURL('image/png') + '")');

                    if (typeof wURL.revokeObjectURL != 'undefined' && wURL.revokeObjectURL && _this.fileurl) {
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
      toggleFileCloseButton();
    };
    this.select = function() {
      $('#qrthumbselected').removeAttr('id');
      this.el.attr('id', 'qrthumbselected');
      if (selectedreply != this) {
        if (!useFile || $file[0].files.length && this.file != $file[0].files[0])
          resetFileInput();
      }
      selectedreply = this;
      $comment.val(selectedreply.comment)
        .off('.selectedreply')
        .on('input.selectedreply change.selectedreply', function() {
          selectedreply.comment = $comment.val();
        });
      toggleFileCloseButton();
    };
    this.rmfile = function(dontResetFileInput) {
      if (this.file != null) {
        if (usewURL && typeof wURL.revokeObjectURL != 'undefined' && wURL.revokeObjectURL && this.fileurl) {
          wURL.revokeObjectURL(this.fileurl);
          delete this.fileurl;
        }
        delete this.file;
        this.el.css('background-image', 'none')
          .attr('title', '');
      }
      if (!dontResetFileInput && selectedreply === this) {
        resetFileInput();
      }
      toggleFileCloseButton();
    };
    this.rm = function() {
      this.rmfile();
      if (replies.length > 1) {
        this.el.remove();
        const index = replies.indexOf(this);
        replies.splice(index, 1);
      } else {
        $QRImagesWrapper.hide();
        this.comment = '';
      }
      // Even if this was the only reply and we
      // didn't remove it, still reselect it so the
      // comment field and such gets reset.
      if (selectedreply === this)
        replies[0].select();
      toggleCloseButton();
      toggleFileCloseButton();
    };
  }
  function toggleCloseButton() {
    if (replies.length === 1) {
      replies[0].el.addClass('qr-only-post');
    } else {
      replies.forEach(replyItem => {
        replyItem.el.removeClass('qr-only-post');
      });
    }
  }
  function toggleFileCloseButton() {
    if (selectedreply.file) {
      $filebutton.text('File Selected...');
      $fileRemove.removeClass('hide-file-close');
    } else {
      $filebutton.text('Browse...');
      $fileRemove.addClass('hide-file-close');
    }
  }
  function addReply() {
    selectedreply = new reply();
    selectedreply.select();
    replies.push(selectedreply);
    toggleCloseButton();
  }

  let selectedreply = null;
  addReply();
  toggleFileCloseButton();

  $fileRemove.click(evt => {
    evt.preventDefault();
    selectedreply.rmfile();
  });

  const max_filesize = $oldFile.attr('data-max-filesize');
  const max_video_filesize = $oldFile.attr('data-max-video-filesize');

  if (!useQueuing) {
    $QR.addClass('noQueuing');
    $autolabel.hide();
    $QRAddImageButton.hide();
    QR.fileInput = function(files) {
      $QRwarning.text('');
      if (!files || files.length != 1)
        return;
      const file = files[0];
      if (!file)
        return;

      if ('size' in file && (file.size > (/^video\//.test(file.type) ? max_video_filesize : max_filesize))) {
        $QRwarning.text(file.name + ' is too large');
        resetFileInput();
        return;
      } else if ('type' in file && !/^image\//.test(file.type) && file.type != 'video/webm') {
        $QRwarning.text(file.name + ' has an unsupported file type');
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
    $QR.addClass('queuing');
    $file.attr('multiple', '');
    QR.fileInput = function(files) {
      $QRwarning.text('');
      if (!files || files.length == 0)
        return;

      if (usewURL)
        $QRImagesWrapper.show();

      for (let i = 0, len = files.length; i < len; i++) {
        const file = files[i];

        if ('size' in file && (file.size > (/^video\//.test(file.type) ? max_video_filesize : max_filesize))) {
          $QRwarning.text(file.name + ' is too large');
        } else if ('type' in file && !/^image/.test(file.type) && file.type != 'video/webm') {
          $QRwarning.text(file.name + ' has an unsupported file type');
        } else if (selectedreply.file == null) {
          selectedreply.setfile(file);
        } else {
          if (files.length == 1 && i == 0) {
            selectedreply.setfile(file);
          } else {
            const newreply = new reply();
            newreply.setfile(file);
            replies.push(newreply);
          }
        }
      }
      resetFileInput();
    };
  }

  if (useFormData && useFile) {
    $(document).on('drop.qrfile', function(event) {
      const oEvent = event.originalEvent;
      if (!use_QR || !('dataTransfer' in oEvent) || !('files' in oEvent.dataTransfer) || $.inArray('Files', oEvent.dataTransfer.types) == -1 || !oEvent.dataTransfer.files || oEvent.dataTransfer.files.length == 0 )
        return;
      QR.open();
      QR.fileInput(oEvent.dataTransfer.files);
      event.preventDefault();
    });
    $(document).on('dragover.qrfile', function(event) {
      const oEvent = event.originalEvent;
      if (!use_QR || !('dataTransfer' in oEvent) || !('files' in oEvent.dataTransfer) || $.inArray('Files', oEvent.dataTransfer.types) == -1 )
        return;
      oEvent.dataTransfer.dropEffect = 'copy';
      event.preventDefault();
    });
  }

  $file
    .attr('title', 'Shift+Click to remove the selected image')
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
      return size + ' B';
    if (size < 1048576)
      return (size/1024).toFixed(0) + ' KB';
    return (size/1048576).toFixed(2) + ' MB';
  }

  $(document).keydown(function(event) {
    if (!use_QR || event.ctrlKey || event.metaKey || event.altKey)
      return true;

    if (event.which == 27) {
      QR.close();
      return false;
    }

    if (/TEXTAREA|INPUT/.test(event.target.nodeName))
      return true;

    if ((event.which == 81 && !event.shiftKey) ||
     (event.which == 73 && event.shiftKey)) {
      QR.open();
      return false;
    }
  });

  function stealCaptcha() {
    $QRCaptchaPuzzleImage
      .css('visibility', 'visible')
      .attr('src', $captchaPuzzle.find('img').attr('src'));
    $QRCaptchaChallengeField.val( $('#recaptcha_challenge_field').val() );
    $QRCaptchaAnswer.val('').prop('disabled', false);
  }

  function stealFormHiddenInputs(context) {
    $('.QRhiddenInputs', $QRForm).remove();

    $('input, textarea', context)
      .filter(function() {
        return !QRInputNames[$(this).attr('name')];
      })
      .clone()
      .addClass('QRhiddenInputs')
      .hide()
      .appendTo($QRForm);
  }
  stealFormHiddenInputs($oldForm);

  function QRrepair() {
    if ($captchaPuzzle.length) {
      $QRCaptchaPuzzleImage.css('visibility', 'hidden');
      $QRCaptchaAnswer.val('').prop('disabled', true);
      global.Recaptcha.reload();
    }
  }

  if ($captchaPuzzle.length) {
    stealCaptcha();
    $('#recaptcha_image', $oldForm).on('DOMNodeInserted', function() {
      stealCaptcha();
    });
  }

  $QRCaptchaPuzzleDiv.click(function() {
    global.Recaptcha.reload();
  });

  function checkNameDisable() {
    if ($oldName.length == 0)
      $name.prop('disabled', true);
    if ($oldEmail.length == 0)
      $email.prop('disabled', true);
    if ($oldSubject.length == 0)
      $subject.prop('disabled', true);
  }
  checkNameDisable();

  if ($oldName.length == 0)
    $name.remove();
  if ($oldEmail.length == 0)
    $email.remove();
  if ($oldSubject.length == 0)
    $subject.remove();

  function setQRFormDisabled(disabled) {
    $('input, textarea, button', $QRForm).prop('disabled', disabled);
    if (!disabled)
      checkNameDisable();
  }

  const stickDistance = 10;

  let QRtopY;
  function setTopY() {
    if ($('.boardlist.top').css('position')=='fixed') {
      QRtopY = $('.boardlist.top').height();
    } else {
      QRtopY = 0;
    }
  }
  setTopY();

  function positionQR(newX, newY) {
    if (newX < stickDistance) {
      $QR.css('left', 0).css('right', '');
    } else if (newX + $QR.width() > $(window).width() - stickDistance) {
      $QR.css('left', '').css('right', 0);
    } else {
      $QR.css('left', newX).css('right', '');
    }
    if (newY < stickDistance + QRtopY) {
      $QR.css('top', QRtopY).css('bottom', '').data('at top', true);
    } else if (newY + $QR.height() > $(window).height() - stickDistance) {
      $QR.css('top', '').css('bottom', 0).data('at top', false);
    } else {
      $QR.css('top', newY).css('bottom', '').data('at top', false);
    }
  }

  function loadQRposition() {
    setTopY();
    if (!window.localStorage || localStorage.qrX == null || localStorage.qrY == null)
      return false;
    let newX;
    if (localStorage.qrX == Infinity)
      newX = Infinity;
    else
      newX = parseInt(localStorage.qrX);
    let newY;
    if (localStorage.qrY == Infinity)
      newY = Infinity;
    else
      newY = parseInt(localStorage.qrY);
    positionQR(newX, newY);
  }

  function saveQRposition() {
    if (!window.localStorage) return;
    if ($QR.css('right')=='0px')
      localStorage.qrX = Infinity;
    else
    localStorage.qrX = parseInt($QR.css('left'));

    if ($QR.data('at top'))
      localStorage.qrY = 0;
    else if ($QR.css('bottom')=='0px')
      localStorage.qrY = Infinity;
  else
    localStorage.qrY = parseInt($QR.css('top'));
  }

  $QRmove.mousedown(function(event) {
    if (event.which != 1)
      return;
    event.preventDefault();
    setTopY();
    let sLeft, sTop;
    function calibrateScroll() {
      sLeft = $(window).scrollLeft();
      sTop = $(window).scrollTop();
    }
    calibrateScroll();
    const startPos = $QR.position();
    const xoff = event.pageX - sLeft - startPos.left;
    const yoff = event.pageY - sTop - startPos.top;

    $(window).on('mousemove.qrmove', event => {
      const newX = event.pageX - sLeft - xoff;
      const newY = event.pageY - sTop - yoff;
      positionQR(newX, newY);
    }).on('scroll.qrmove', () => {
      calibrateScroll();
    }).on('mouseup.qrmove', () => {
      $(window).off('.qrmove');
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
      return;
    }

    if (!selectedreply.comment && !selectedreply.file && !$file.val()) {
      $QRwarning.text('Your post must have an image or a comment!');
      return;
    }

    if ($captchaPuzzle.length && $QRCaptchaAnswer.val().trim().length == 0) {
      $QRwarning.text('You forgot to do the CAPTCHA!');
      return;
    }

    if (window.localStorage) {
      if ($QRForm[0].elements.name != null)
        localStorage.setItem('name', $QRForm[0].elements.name.value.replace(/( |^)## .+$/, ''));
      if ($QRForm[0].elements.email != null && $QRForm[0].elements.email.value != 'sage')
        localStorage.setItem('email', $QRForm[0].elements.email.value);
    }

    $password.val( $("form[name='postcontrols'] input#password").val() );

    $QRwarning.text('');

    let data;
    if (useFormData) {
      try {
        data = new FormData($QRForm[0]);
      } catch (e) {
        //ignore, data being unset is handled below
      }
    }

    if (!data) {
      $QRForm.submit();
      return;
    }

    data.append('post', $submit.val());
    data.append('wantjson', 1);
    if (!$file.val())
      data.append('file', selectedreply.file);

    setQRFormDisabled(true);
    $submit.val('...').prop('disabled', false);

    let hasCancelled = false;
    query = {
      abort() {
        hasCancelled = true;
        query = null;
        prepSubmitButton();
        $QRwarning.text('Post discarded');
        setQRFormDisabled(false);
      }
    };

    if (hasCancelled)
      return;

    const url = $QRForm.attr('action');
    query = $.ajax({
      url: url,
      data: data,
      cache: false,
      contentType: false,
      processData: false,
      type: 'POST',
      dataType: 'json',
      xhr() {
        const xhr = new window.XMLHttpRequest();
        if (xhr.upload) {
          xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable)
              $submit.val(Math.round(e.loaded * 100 / e.total).toString() + '%');
          }, false);
        }
        return xhr;
      },
      success(data) {
        query = null;
        setQRFormDisabled(false);
        if (data.status == 'success') {
          if (settings.getSetting('QR_persistent') || (replies.length > 1))
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

          QRcooldown(10);

          if (data.threadid == null) {
            window.location.href = data.url;
          } else {
            setTimeout(updateThreadNow, 10, true);
          }
        } else {
          $QRwarning.text('Unknown error: '+String(data && data.error));
          console.log('Unknown QR response', data); //eslint-disable-line no-console
          prepSubmitButton();
        }
      },
      error(jqXHR, textStatus, errorThrown) {
        query = null;
        prepSubmitButton();
        setQRFormDisabled(false);
        if (jqXHR.responseJSON) {
          const data = jqXHR.responseJSON;
          if (data.error == 'message') {
            if (data.message_html)
              $QRwarning.html(data.message_html);
            else
              $QRwarning.text(data.message);
          } else if (data.error == 'ban') {
            const pageState = {title: 'Ban', banpage: data.banhtml};
            state.newState(pageState);
          } else {
            $QRwarning.text('Unknown error: '+data.error);
          }
        } else {
          $QRwarning.text(jqXHR.status == 0 && textStatus == 'abort' ? 'Post discarded' : 'Connection error');
        }
        const info = {xhrstatus: jqXHR.status, textStatus, errorThrown};
        console.log('Ajax Error', info, jqXHR); //eslint-disable-line no-console
      }
    });

    QRrepair();
  }

  function QRInit() {
    use_QR = settings.getSetting('use_QR');
    if (use_QR) {
      $oldForm.hide();
      $QRButtonDiv.show();
      if ($captchaPuzzle.length)
        stealCaptcha();
      if (settings.getSetting('QR_persistent'))
        QR.open();
    } else {
      QR.close();
      $oldForm.show();
      $QRButtonDiv.hide();
    }
  }

  function init_flexstyle() {
    if (settings.getSetting('QR_flexstyle')) {
      $persona.addClass('useflexstyle');
    } else {
      $persona.removeClass('useflexstyle');
    }
  }
  init_flexstyle();

  QRInit();
  $(document).on('setting_change', function(e, setting) {
    if (setting == 'use_QR')
      QRInit();
    else if (setting == 'show_mature')
      init_mature_button();
    else if (setting == 'QR_flexstyle')
      init_flexstyle();
  });
});
