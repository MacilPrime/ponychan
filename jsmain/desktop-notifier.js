/*
 * desktop-notifier.js
 */

(function() {
  'use strict';

  settings.newSetting(
    "desktop_notifications",
    "bool",
    false,
    "Enable Reply Desktop Notifications",
    'links', {
      orderhint: 8,
      moredetails: $("<button/>")
        .text("Test notification")
        .click(buttonEvent),
      moredetails_rawhtml: true
    }
  );

  function buttonEvent(evt) {
    Notification.requestPermission(function() {
      if (Notification.permission == "granted") {
        var note = new Notification("Board settings - MLPchan", {
          body: "This is a test",
          tag: "desktop_test",
          icon: siteroot + "static/mlpchanlogo.png"
        });
        setTimeout(function() {
          note.close();
        }, 3000);
      }
    });
  }

  function canNotify() {
    return window.Notification && Notification.permission == 'granted' &&
      !pageHasFocus() && settings.getSetting("desktop_notifications");
  }

  function init() {
    if (!window.Notification) {
      $("#setting_desktop_notifications").hide();
    } else {
      if (settings.getSetting("desktop_notifications")) {
        Notification.requestPermission();
      }
      $(document).on('setting_change', function(e, setting) {
        if (setting == "desktop_notifications")
          Notification.requestPermission();
      }).on('new_unseen_post', function(e, post) {
        var $post = $(post);
        if ($post.find('.younote').length && canNotify()) {
          makeNote($post);
        }
      });
    }
  }

  function makeNote($post) {
    var note = new Notification(makeHeadLine($post), {
      body: getBody($post),
      tag: "desktop_" + $post.attr('id').split("_")[1],
      icon: siteroot + "static/mlpchanlogo.png"
    });

    // TODO bacon
    function closer() {
      note.close();
      $(window).off('focus', closer);
    }
    $(window).on('focus', closer);

    note.addEventListener("click", function() {
      // sometimes calling window.focus() doesn't trigger the focus event on chrome
      closer();
      window.focus();
      // TODO scroll to specific reply
      window.scrollTo(0, document.body.scrollHeight);
    }, false);
  }

  function makeHeadLine(postEl) {
    var $intro = $('.intro', postEl).first();
    var subject = $intro.find('.subject').first().text();
    if (subject.length)
      subject += ' — ';
    var name = $intro.find('.namepart').first().text();
    return subject + name;
  }

  function getBody(postEl) {
    // TODO this should be moved to some general function that gets text
    // from an element while attempting to respect newlines.
    var $body = $(".body", postEl).first().clone();
    $body.html($body.html().replace(/<br\b[^>]*>/g, "; "));
    var text = $body.text().replace(/^(; )+/, '');
    if (text.length > 120)
      text = text.substr(0, 120) + '…';
    return text;
  }

  init();
})();
