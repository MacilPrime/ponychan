# Tinyboard/MLPchan

Tinyboard/MLPchan is a fork of the Tinyboard imageboard project, extended to
have new features, many bugs fixed, and customized for MLPchan specifically.

Tinyboard is a light-weight, fast, highly configurable and user-friendly
imageboard software package released under a non-restrictive open-source
license. It is written in PHP and has few dependencies.

## Quick Development Start

1. Install Vagrant and VirtualBox.
2. Run "vagrant up" to start up a local virtual machine that will run a copy of
 MLPchan on yur local computer for development.
3. When that completes, (as it instructs you to) visit
 http://localhost:8080/install.php to complete the Tinyboard installation,
 while leaving the database settings as default, and then browse to
 http://localhost:8080/mod.php and log in as admin:password.

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
3. Install MLPchan's local javascript dependencies by running `npm install`
 inside this repository's directory.

Now run `gulp` to build the client javascript. You may pass the `--watch` (`-w`)
option to make gulp continue running and automatically rebuild the javascript
when any of the source files change.

Mocha is used for javascript unit tests. Just run `mocha` to execute all of the
javascript tests in the test/ directory. We don't have that many yet and can
always use more.

There are no PHP unit tests yet. This is an issue.

## Requirements

1. PHP >= 5.2.5
2. [mbstring](http://www.php.net/manual/en/mbstring.installation.php)
 (--enable-mbstring)
3. [PHP-GD](http://php.net/manual/en/book.image.php)
4. [PHP-PDO](http://php.net/manual/en/book.pdo.php)
 (only MySQL is supported at the moment)

We try to make sure Tinyboard is compatible with all major web servers and
operating systems. Tinyboard does not include an Apache ```.htaccess``` file nor does
it need one.

## Contributing

You can contribute to Tinyboard by:
* Developing patches/improvements/translations and using GitHub to submit pull requests
* Providing feedback and suggestions
* Writing/editing documentation

## Installation

1. Build the client javascript as described above.

2. Extract the `SERVER/` directory to your web directory.

3. Navigate to ```install.php``` in your web browser and follow the
 prompts.
4. Tinyboard should now be installed. Log in to ```mod.php``` with the
 default username and password combination: **admin / password**.

Please remember to change the administrator account password.

See also: [Configuration Basics](http://tinyboard.org/docs/?p=Config).

## Support

Tinyboard is still beta software -- there are bound to be bugs. If you find a
bug, please report it.

If you need assistance with installing, configuring, or using Tinyboard, you may
find support from a variety of sources:

*	If you're unsure about how to enable or configure certain features, make
	sure you have read the comments in ```inc/config.php```.
*	Documentation can be found [here](http://tinyboard.org/docs/).

## License

All code original to the Tinyboard project is under an MIT-like license
described in `LICENSE-Tinyboard.md`.

Newer code, including everything under `src/` except for the files under
`src/main/legacy/`, is under the MIT license as described in
`LICENSE-Macil.txt`.
