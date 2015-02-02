## Quick Development Start

1. Install Vagrant and VirtualBox.
2. Run "vagrant up" to start up a local virtual machine that will run a copy of
 MLPchan on yur local computer for development.
3. When that completes, (as it instructs you to) visit
 http://172.27.0.2/install.php to complete the Tinyboard installation,
 while leaving the database settings as default, and then browse to
 http://172.27.0.2/mod.php and log in as admin:password.

All changes to PHP files will immediately take effect in the Vagrant virtual
machine. The one exception is that the virtual machine has its own
`instance-config.php` file. To edit this file directly, you must `vagrant ssh`
to get a shell into the vm, and then run `nano /var/www/instance-config.php`.

Use the following command to see nginx's error log, which will contain
any PHP errors. This is extremely recommended when doing any server work!

    vagrant ssh -- sudo tail --follow=name /var/log/nginx/error.log

The client javascript is stored under `src/` and Gulp and Browserify are used to
build it into the output file served by the site. Prerequisites for building the
client javascript:

1. Install Node.js onto your system.
2. Install gulp and mocha onto your system with `npm install -g gulp mocha`.
3. `cd client-core`
4. Install MLPchan's local javascript dependencies by running `npm install`
 inside the client-core directory.

Now run `gulp` to build the client javascript. You may pass the `--watch` (`-w`)
option to make gulp continue running and automatically rebuild the javascript
when any of the source files change.

Mocha is used for javascript unit tests. Just run `mocha` to execute all of the
javascript tests in the test/ directory. We don't have that many yet and can
always use more.

There are no PHP unit tests yet. This is an issue.
