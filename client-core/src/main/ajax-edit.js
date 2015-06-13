/**
 * ajax-edit
 *
 * Edit posts without leaving the page.
 *
 */

import $ from "jquery";
import {footer} from "./footer-utils";
import myPosts from "./my-posts";
import {
    get_post_num,
    get_thread_num,
    get_post_board,
    get_post_id
    } from './post-info';


$(document).ready(function () {
    var password;
    // password will be defined if the board supports editing.

    function init() {
        function onEachPost($post) {
            if (myPosts.contains(get_post_id($post))) {
                giveEditControls($post);
            }
        }

        // check if the board is editable and that formdata is supported.
        if ($(".edit_post").length > 0 && "FormData" in window) {

            (function () {
                const $password = $("#password");
                $(document).on("click.footer-item", function () {
                    // This saved password only refreshes when you click
                    // the edit button. That way, in the event that the
                    // user changes the password while having the edit
                    // form open, the post will still go through.
                    password = $password.val();
                });
                // assume it's not loaded yet here.
                password = localStorage.password;
            })();

            $(".post").each(function () {
                onEachPost($(this));
            });

            $(document).on("new_post", function (e, post) {
                onEachPost($(post));
            });
        }
    }
    function giveEditControls($post) {

        function getEditForm() {
            return $post.find(".edit-form");
        }

        footer($post).addItem("Edit", function (evt) {

            if (getEditForm().length > 0) {

                // the post body is hidden with css.
                closeForm();

            } else {

                // ajax the edit post form first
                $(evt.target).text("Editing...");
                var editRequest = new FormData();
                editRequest.append("board", get_post_board($post));
                editRequest.append("delete_" + get_post_num($post), "true");
                editRequest.append("password", password);
                editRequest.append("edit", "Edit");

                $.ajax({
                    url: SITE_DATA.siteroot + "post.php",
                    data: editRequest,
                    cache: false,
                    contentType: false,
                    processData: false,
                    type: 'POST',
                    success: function (data) {
                        var $data = $(data);
                        if ((/<title>Error<\/title>/).test(data)) {
                            // pull the potential error message
                            // out of the received page
                            alert("Error: " + $data.find("h2").first().text());
                            closeForm();
                        } else {
                            buildForm($data.find("#body").text());
                        }
                    },
                    error: function(xhr, textStatus, exception) {
                        alert("Error: Failed to connect to server");
                        console.log("AJAX error", {
                            xhrstatus: xhr.status,
                            textStatus: textStatus,
                            errorThrown: exception
                        });
                        closeForm();
                    }
                });
            }

            function buildForm(postContent) {

                var $editForm = $('<div />')
                    .addClass("edit-form")
                    .fadeIn("fast")
                    .insertBefore($post.find(".body").first());

                var $message = $('<textarea />')
                    .text(postContent)
                    .attr("name", "body")
                    .addClass('edit-body')
                    .appendTo($editForm);

                var $editControls = $('<div />')
                    .addClass("edit-controls")
                    .appendTo($editForm);

                $('<input />')
                    .attr("value", "Submit")
                    .attr("type", "submit")
                    .on("click", sendRevision)
                    .appendTo($editControls);

                $('<a />')
                    .text("Cancel")
                    .attr("href", "javascript:;")
                    .on("click", closeForm)
                    .appendTo($editControls);

                // DOM setup over

                function sendRevision(evt) {

                    // stop the submit button
                    evt.preventDefault();

                    // change the submit button's message.
                    $(this).val("Posting...");

                    // disable everything.
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
                        success: function (data) {
                            var $data = $(data);
                            if ((/<title>Error<\/title>/).test(data)) {
                                alert("Error: " + $data.find("h2").first().text());
                            } else {
                                retrieveRevision();
                            }
                        },
                        error: function(xhr, textStatus, exception) {
                            alert("Error: Failed to submit post to server");
                            console.log("AJAX error", {
                                xhrstatus: xhr.status,
                                textStatus: textStatus,
                                errorThrown: exception
                            });
                            closeForm();
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
                        success: function (data) {
                            var $newPost = $(data)
                                .find(".post_" + get_post_num($post));
                            if ($newPost) {
                                $newPost.find(".body").fadeIn();
                                // replace the node and its events binded.
                                $post.replaceWith($newPost);
                                $(document).trigger("new_post", $newPost);
                            } else {
                                alert("Error: Failed to find post.");
                                closeForm();
                            }
                        },
                        error: function(xhr, textStatus, exception) {
                            alert("Error: Failed to retrieve post.");
                            console.log("AJAX error", {
                                xhrstatus: xhr.status,
                                textStatus: textStatus,
                                errorThrown: exception
                            });
                            closeForm();
                        }
                    });
                }
            }

            function closeForm() {
                let $editForm = getEditForm();
                if ($editForm.length > 0) {
                    $editForm.fadeOut().remove();
                }
                $(evt.target).text("Edit");
            }
        });
    }
    init();
});
