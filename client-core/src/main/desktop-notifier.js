import $ from 'jquery';
import Bacon from 'baconjs';
import settings from './settings';
import {jumpToPost} from './post-utils';
import {get_post_id} from './post-info';

settings.newSetting(
  "desktop_notifications",
  "bool",
  false,
  "Enable Reply Desktop Notifications",
  'links', {
    orderhint: 8,
    moredetails: $("<div/>").append(
      $("<div/>")
        .text(
          "Shows a desktop notification when you get a reply in an open " +
          "thread while you don't have the thread's window focused."),
      $("<button/>")
        .text("Test notification")
        .click(buttonEvent)
    ),
    moredetails_rawhtml: true
  }
);

function buttonEvent(evt) {
  Notification.requestPermission(function() {
    if (Notification.permission == "granted") {
      var note = new Notification("Board settings - MLPchan", {
        body: "This is a test",
        tag: "desktop_test",
        icon: SITE_DATA.siteroot + "static/mlpchanlogo.png"
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
  const postId = get_post_id($post);
  const note = new Notification(makeHeadLine($post), {
    body: getBody($post),
    tag: "desktop_" + postId,
    icon: SITE_DATA.siteroot + "static/mlpchanlogo.png"
  });

  const noteClicks = Bacon.fromEvent(note, 'click');

  Bacon.mergeAll(
    Bacon.fromEvent(window, 'focus'), noteClicks
  ).take(1).onValue(() => {
    note.close();
  });

  noteClicks.onValue(() => {
    // sometimes calling window.focus() doesn't trigger the focus event on
    // chrome, hence letting the click event close the note above too.
    window.focus();
    jumpToPost(postId);
  });
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
