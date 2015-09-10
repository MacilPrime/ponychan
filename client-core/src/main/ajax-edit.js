/**
 * ajax-edit
 *
 * Edit posts without leaving the page.
 *
 */

import $ from "jquery";
import {footer} from "./footer-utils";
import myPosts from "./my-posts";
import {get_post_num, get_thread_num, get_post_board, get_post_id, get_post_body} from './post-info';
import * as state from './state';
import config  from './config';

$(document).ready(function() {
  init();

  function init() {
    $('.edit-form').remove();

    $(".post").each(function() {
      giveEditControls($(this));
    });

    $(document).on("new_post", function(e, post) {
      giveEditControls($(post));
    });
  }

  function giveEditControls($post) {
    function getEditForm() {
      return $post.find(".edit-form");
    }

    function getPostTime() {
      return new Date($post.find('time').attr('datetime')).getTime();
    }

    const isEditable = window.FormData && config.board.allow_self_edit &&
      myPosts.contains(get_post_id($post)) &&
      (config.board.edit_time_end === 0 || Date.now() < getPostTime() + config.board.edit_time_end*1000);

    if (!isEditable) {
      return;
    }

    footer($post).addItem("Edit", function(evt) {
      const $footerEditButton = $(evt.target);

      const password = $("#password").val();
      if (getEditForm().length > 0) {
        // the post body is hidden with css.
        closeForm();
      } else {
        // ajax the edit post form first
        $footerEditButton.text("Editing...");
        var editRequest = new FormData();
        editRequest.append("board", get_post_board($post));
        editRequest.append("delete_" + get_post_num($post), "true");
        editRequest.append("password", password);
        editRequest.append("edit", "Edit");

        // TODO make some nice JSON api for this to use.
        $.ajax({
          url: SITE_DATA.siteroot + "post.php",
          data: editRequest,
          cache: false,
          contentType: false,
          processData: false,
          type: 'POST',
          success: function(data) {
            var $data = $($.parseHTML(data));
            buildForm($data.find("#body").text());
          },
          error: function(xhr, textStatus, exception) {
            handleConnectionError(xhr);
            closeForm();
          }
        });
      }

      function buildForm(postContent) {
        var $editForm = $('<div />')
          .addClass("edit-form")
          .fadeIn("fast")
          .insertBefore(get_post_body($post));

        var $message = $('<textarea />')
          .text(postContent)
          .attr("name", "body")
          .addClass('edit-body')
          .appendTo($editForm);

        var $editControls = $('<div />')
          .addClass("edit-controls")
          .appendTo($editForm);

        var $submit = $('<input />')
          .attr("value", "Submit")
          .attr("type", "button")
          .on("click", sendRevision)
          .appendTo($editControls);

        $('<input />')
          .attr("value", "Cancel")
          .attr("type", "button")
          .on("click", closeForm)
          .appendTo($editControls);

        // DOM setup over

        function sendRevision(evt) {
          $submit.val("Posting...");
          $editForm
            .find("input, textarea")
            .prop("disabled", true);

          // create form data first.
          var revision = new FormData();
          revision.append("editpost", "1");
          revision.append("board", get_post_board($post));
          revision.append("id", get_post_num($post));
          revision.append("password", password);
          revision.append("mod", "0");
          // maybe we'll deal with the mod stuff later
          // or just totally skip it.
          revision.append("body", $message.val());

          // send request
          $.ajax({
            url: SITE_DATA.siteroot + "post.php",
            data: revision,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            success: function(data) {
              retrieveRevision();
            },
            error: function(xhr, textStatus, exception) {
              handleConnectionError(xhr);
              $submit.val("Submit");
              $editForm
                .find("input, textarea")
                .prop("disabled", false);
            }
          });
        }

        function retrieveRevision() {
          // We always have to go to the full thread to retrieve
          // the post. What if the post drops off the current page?
          function buildURL() {
            var root;

            // 1. Figure out if you need the page with mod controls.
            const modPage = SITE_DATA.siteroot + "mod.php";
            if (document.location.pathname === modPage) {
              root = modPage + "?/";
            } else {
              root = SITE_DATA.siteroot;
            }

            // 2. Get thread page
            return root + get_post_board($post) + "/res/" +
              get_thread_num($post) + ".html";
          }

          $.ajax({
            url: buildURL(),
            cache: false,
            success: function(data) {
              var $newPost = $(data)
                .find(".post_" + get_post_num($post));
              if ($newPost) {
                $post.html($post.html()); // erase all events.
                var $newBody = get_post_body($newPost);
                get_post_body($post).replaceWith($newBody);
                closeForm();
                $footerEditButton.remove();
                $(document).trigger("new_post", $post);
                $newBody.hide();
                $newBody.fadeIn('fast');
              } else {
                alert("Error: Failed to refresh post.");
                closeForm();
              }
            },
            error: function(xhr, textStatus, exception) {
              handleConnectionError(xhr);
              closeForm();
            }
          });
        }
      }

      function handleConnectionError(xhr) {
        var $data = $($.parseHTML(xhr.responseText));
        var title = $data.filter('title').first().text();
        if (title && /Error/.test(title)) {
          alert("Error: " + $data.find("h2").first().text());
        } else if (title && /Banned/.test(title)) {
          var pageState = {title: 'Ban', banpage: xhr.responseText};
          state.newState(pageState);
        } else {
          console.log("Ajax Error", xhr);
          alert("Error: Connection failed");
        }
      }

      function closeForm() {
        let $editForm = getEditForm();
        if ($editForm.length > 0) {
          $editForm.remove();
        }
        $footerEditButton.text("Edit");
      }
    });
  }
});
