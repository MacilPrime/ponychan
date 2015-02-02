# Tinyboard/MLPchan

Tinyboard/MLPchan is a fork of the Tinyboard imageboard project, extended to
have new features, many bugs fixed, and customized for MLPchan specifically.

Tinyboard is a light-weight, fast, highly configurable and user-friendly
imageboard software package released under a non-restrictive open-source
license. It is written in PHP and has few dependencies.

## Quick Development Start

Please read the "Quick Development Start" section of the README.md file in the
parent directory. The contents of this file are specific to this core/Tinyboard
module, aren't necessary to know when using the Vagrant dev environment, and
might be a bit outdated.

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

2. Extract the `core/` directory to your web directory.

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
