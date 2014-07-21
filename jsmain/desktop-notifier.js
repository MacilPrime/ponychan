/*
 * desktop-notifier.js
 *
 * Inspected with JSLint as well as Inspection-JS
 * Released under no licenses lol
 *
 * ATTENTION: requires modification to allow "moredetails" to accept dom nodes
 * inside settings.newSetting method
 */

(function() {
    // Need documentation for this API?
    // https://developer.mozilla.org/en-US/docs/Web/API/notification#Parameters
    var client = {}; // setting object
    // desktop notifiers have a whole bunch of requirements to run
    function init() {
        if (window.Notification) {
            // start reading here!
            checkYourPrivilege();
            makeUI();
            listenToNewPosts();
        }
    }
    function checkYourPrivilege() {
        // This API has a complex hierarchy of privileges actually.
        client.perm = Notification.permission;
        // Web notes mandate client permissions for understandable reasons.
        try {
            client.enabled = settings.getSetting("notes_on_desktop");
        } catch (e) {
            client.enabled = false;
        }
        // Check if the user has checked off the notification setting
        client.ready = (client.perm == "granted" && client.enabled);
        // Check if both user and browser have greenlighted this action
        client.engaged = (client.ready && !document.hasFocus());
        // Check if the window is qualified for live notifications
    }
    function makeUI() {
        settings.newSetting(
            "notes_on_desktop",
            "bool",
            false,
            "Show desktop notifications for replies",
            'links',
            {
                orderhint: 8,
                moredetails: $("<button/>")
                    .text("Test notification")
                    .click(buttonEvent),
                moredetails_rawhtml: true
            }
        );
        $(document).on("setting_change", function (e, setting) {
            if (setting == "notes_on_desktop") {
                checkYourPrivilege();
            }
        });
    }
    function buttonEvent(evt) {
        // This is probably the most awkward line of code here. The
        // permission request function is basically an event listener that
        // triggers when the user clicks on a button in the security ribbon.
        try {
            Notification.requestPermission(function () {
                if (Notification.hasOwnProperty("permission")) {
                    checkYourPrivilege();
                }
            });
        } catch (e) {
            evt.target.textContent = "Error: incomplete API.";
            evt.target.removeEventListener("click", buttonEvent);
            evt.target.href = "http://caniuse.com/notifications";
            // Older versions of chrome will likely get this error, as
            // their legacy API is for extensions only, and therefore do
            // not have the permission request object.
        }
        // This will either trigger the browser permission alert
        // or if it's running, it will trigger a test notification.
        if (client.perm == "granted") {
            var note = new Notification("Board settings - MLPchan", {
                body: "This is a test",
                tag: "desktop_test",
                icon: siteroot+"static/mlpchanlogo.png"
            });
            setTimeout(function () {
                try {
                    note.close();
                } catch (e) {
                    console.log("Note already closed.");
                }
            }, 3000);
        }
    }
    function listenToNewPosts() {
        // reminder that changes will still have to be made to account
        // for filtered replies.
        $(document).on('new_post', function (e, postEl) {
            checkYourPrivilege();
            if (postEl.id == null || postEl.id == undefined) {
                return;
            }
            setTimeout(function () {
                var youRefEl = postEl.getElementsByClassName("younote")[0];
                if (youRefEl != undefined && client.engaged) {
                    // this is where notifications are triggered
                    makeNote(postEl, youRefEl);
                }
            }, 100);
        });
    }
    function makeNote(postEl, youRefEl) {
        var note = new Notification(makeHeadLine(postEl), {
            body: getBody(postEl, youRefEl),
            tag: "desktop_" + postEl.id.split("_")[1],
            icon: getThumbNail(postEl)
        });
        // Tagging notes will silence all duplicate posts for you already.
        // now that we have the note displayed, it would probably make sense
        // to have a way to direct it to the window in reference.
        window.addEventListener("focus", function () {
            note.close();
        }, false);
        // sometimes the user will find the window on their own.
        // if this is the case, we need to close the notification ourselves.
        note.addEventListener("click", function () {
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
    function getBody(postEl, youRefEl) {
        // TODO this should be moved to some general function that gets text
        // from an element while attempting to respect newlines.
        var $body = $("body", postEl).first().clone();
        $body.html( $body.html().replace(/<br\b[^>]*>/g, "; ") );
        var text = $body.text().replace(/^(; )+/, '');
        if (text.length > 120)
            text = text.substr(0, 120) + '…';
        return text;
    }
    function getThumbNail(postEl) {
        var $img = $(".postimg", postEl).first();
        return $img.length ? $img.attr('src') : siteroot+"static/mlpchanlogo.png";
    }
    init();
})();
