#!/bin/sh
# Vagrant bootstrap file

set -e
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get -y install nginx-extras imagemagick php5 php5-cli php5-curl php5-imagick php5-geoip php5-gd php5-fpm redis-server mariadb-server mariadb-client php5-mysql php5-redis graphicsmagick gifsicle libimage-exiftool-perl

# Make sure any imported database is utf8mb4
# http://mathiasbynens.be/notes/mysql-utf8mb4
# Put in /etc/mysql/conf.d/local.cnf
cat - <<EOF123 >/etc/mysql/conf.d/local.cnf
[client]
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4

[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
default-storage-engine = innodb
EOF123

service mysql restart

mysql -uroot -e \
"CREATE DATABASE IF NOT EXISTS tinyboard; \
GRANT USAGE ON *.* TO tinyboard@localhost IDENTIFIED BY ''; \
GRANT ALL PRIVILEGES ON tinyboard.* TO tinyboard@localhost; \
FLUSH PRIVILEGES;"

sed \
  -e 's/post_max_size = .*/post_max_size = 15M/' \
  -e 's/;cgi.fix_pathinfo=1/cgi.fix_pathinfo=0/' \
  -e 's/upload_max_filesize = .*/upload_max_filesize = 15M/' \
  -i /etc/php5/fpm/php.ini

service php5-fpm restart

sudo install -m 775 -o www-data -g www-data -d /var/www
ln -sf \
  /vagrant/SERVER/*.php \
  /vagrant/SERVER/js/ \
  /vagrant/SERVER/static/ \
  /vagrant/SERVER/stylesheets/ \
  /vagrant/*.md \
  /vagrant/LICENSE-Macil.txt \
  /vagrant/install.php \
  /vagrant/install.sql \
  /var/www/
sudo install -m 775 -o www-data -g www-data -d /var/www/templates
sudo install -m 775 -o www-data -g www-data -d /var/www/templates/cache
ln -sf \
  /vagrant/SERVER/templates/* \
  /var/www/templates/
if ! [ -d /var/www/inc ]; then
  sudo install -m 775 -o www-data -g www-data -d /var/www/inc
  ln -sf \
    /vagrant/SERVER/inc/* \
    /var/www/inc/
  rm -f /var/www/inc/instance-config.php

  # Place default vagrant instance-config.php
  cp /vagrant/vagrant/instance-config.php /var/www/inc/
  chown www-data /var/www/inc/instance-config.php

  # Some default settings for vagrant vm
  ln -s /vagrant/vagrant/site-config.php /var/www/inc/
fi

# VirtualBox shared folders don't play nicely with sendfile.
sed \
  -e 's/sendfile on;/sendfile off;/' \
  -i /etc/nginx/nginx.conf

rm -f /etc/nginx/sites-enabled/* /etc/nginx/sites-available/tinyboard.nginx
cp /vagrant/vagrant/tinyboard.nginx /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/tinyboard.nginx /etc/nginx/sites-enabled/
service nginx restart

echo
echo "Server set up, please browse to http://localhost:8080/install.php"
echo "to complete the installation. Default database settings will work."
echo "After you complete the installation steps, go to "
echo "http://localhost:8080/mod.php and log in as admin:password."
