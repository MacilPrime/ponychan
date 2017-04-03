This is the code that ran Ponychan, at least to the point I was last 
involved.

It's based off of Tinyboard. I used to merge in changes from Tinyboard, but I
stopped and fully forked when Tinyboard development slowed down, and when the
site-specific content was becoming hard to keep fully separated in the
codebase.

Originally this codebase ran a site called MLPchan. That site eventually merged
with the pre-existing Ponychan site, and then this codebase was used for the
merged Ponychan site.

Ponychan's code is split into several different interdependent modules.

* core is based on Tinyboard, contains PHP code, and is placed in the
  webserver's publicly accessible document root. When using Vagrant to run the
  site locally, core is run within the Vagrant virtual machine.

* client-core contains the source of the javascript bundles served to users.
  Browserify, babel, and gulp are used to build the bundles. The output bundles
  are automatically placed into core/js/ when built.

* watcher contains the server side code for the /watcher/threads endpoint.
  Nodejs, babel, and Flow are used. If you don't run this module, then the
  thread watcher will not work.

My intention was that server-side functionality would migrate over to the
watcher codebase over time. The watcher codebase is written in Flow-typed
Javascript, so you actually get real type safety there, and it has some unit
tests. There's a few design warts from the old Tinyboard code I was also kinda
trying to get away from, and also the fact that it's almost-MIT licensed (you
have to keep the Tinyboard footer in place). I wanted to quarantine all of the
original Tinyboard code and slowly replace all of it.

## LICENSE

All of the original Tinyboard code under core/ is under the almost-MIT license
in `core/LICENSE-Tinyboard.md`. The rest of the code is under the MIT license
in `core/LICENSE-Macil.txt`.

## Quick Development Start

### core

1. Install Vagrant and VirtualBox.
2. Run "vagrant up" to start up a local virtual machine that will run a copy of
 Ponychan on your local computer for development.
3. When that completes, (as it instructs you to) visit
 http://172.27.0.2/install.php to complete the Tinyboard installation,
 while leaving the database settings as default, and then browse to
 http://172.27.0.2/mod.php and log in as admin:password.
4. In the Administration section's "Manage themes" page, click install on the
 "Categories" and "MLPchan" themes and use the default settings. (TODO:
 Automatically do this in the install process.)

All changes to PHP files will immediately take effect in the Vagrant virtual
machine. The one exception is that the virtual machine has its own
`instance-config.php` file. To edit this file directly, you must `vagrant ssh`
to get a shell into the vm, and then run `nano /var/www/instance-config.php`.

Use the following command to see nginx's error log, which will contain
any PHP errors. This is extremely recommended when doing any server work!

    vagrant ssh -- sudo tail --follow=name /var/log/nginx/error.log

There are no PHP unit tests yet. This is an issue.

### client-core

The client javascript is stored under `src/` and Gulp and Browserify are used to
build it into the output file served by the site. Prerequisites for building the
client javascript:

1. Install Node.js onto your system.
2. Install gulp and mocha onto your system with `npm install -g gulp mocha`.
3. `cd client-core`
4. Install Ponychan's local javascript dependencies by running `npm install`
 inside the client-core directory.

Now run `gulp` to build the client javascript. You may pass the `--watch` (`-w`)
option to make gulp continue running and automatically rebuild the javascript
when any of the source files change, and the `--hot` (`-h`) option to make
changes to supported files be applied immediately in running browsers.

Use `gulp -m` to make a minified production build. The file "main.js" and a
"maps" directory will be created under core/js. These should be uploaded to the
server.

The javascript codebase was only recently transitioned to Browserify, and many
modules still rely on global variables exposed by other modules. The
CommonJS/ES6 module style should be used going further.

Mocha is used for javascript unit tests. Just run `mocha` to execute all of the
javascript tests in the test/ directory. We don't have that many yet and can
always use more.

### watcher

The Vagrant virtual machine must already be running on your computer. When you
run watcher on your computer, it will connect to the virtual machine and access
its mysql and redis databases. The virtual machine's webserver will redirect
connections for /watcher/threads to the watcher instance on your computer. If
you don't run watcher, then those calls will fail and the thread watcher
feature just won't work.

1. `cd watcher`
2. `npm install`
3. `npm start`
