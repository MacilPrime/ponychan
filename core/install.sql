-- phpMyAdmin SQL Dump
-- version 3.4.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Apr 12, 2012 at 11:22 PM
-- Server version: 5.1.61
-- PHP Version: 5.3.3-7+squeeze8

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tinyboard`
--

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE IF NOT EXISTS `migrations` (
  `name` varchar(120) NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Used to store posts that need a CAPTCHA
CREATE TABLE IF NOT EXISTS `review_queue` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ip_type` int(11) NOT NULL COMMENT '0:ipv4, 1:ipv6',
  `ip_data` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  `board` varchar(120) NOT NULL,
  `thread` int(11) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `email` varchar(254) DEFAULT NULL,
  `name` varchar(75) DEFAULT NULL,
  `trip` varchar(25) DEFAULT NULL,
  `capcode` varchar(50) DEFAULT NULL,
  `body_nomarkup` text DEFAULT NULL,
  `file` varchar(50) DEFAULT NULL,
  `filename` text DEFAULT NULL,
  `filehash` text DEFAULT NULL,
  `password` char(40) DEFAULT NULL,
  `userhash` char(40) DEFAULT NULL,
  `rawhtml` int(1) NOT NULL,
  `spoiler` int(1) NOT NULL,
  `mature` int(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `board_thread_time` (`board`, `thread`, `timestamp`),
  KEY `userhash` (`userhash`),
  KEY `ip_type_data` (`ip_type`, `ip_data`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `captchas` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `question` text NOT NULL,
  `answers` text NOT NULL COMMENT 'json array',
  PRIMARY KEY (`id`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

INSERT INTO `captchas` (`question`, `answer`) VALUES
  ('Please type the word "apple".', '["apple"]'),
  ('What is 3+5?', '["8","eight"]');

CREATE TABLE IF NOT EXISTS `captcha_attempts` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `userhash` char(40) DEFAULT NULL,
  `ip_type` int NOT NULL COMMENT '0:ipv4, 1:ipv6',
  `ip_data` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  `captcha_id` int UNSIGNED DEFAULT NULL,
  `correct` int(1) NOT NULL,
  `answer` varchar(75) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userhash_time` (`userhash`, `timestamp`),
  KEY `ip_type_data` (`ip_type`, `ip_data`, `timestamp`),
  KEY `captcha_time` (`captcha_id`, `timestamp`),
  KEY `timestamp` (`timestamp`),
  FOREIGN KEY (captcha_id)
    REFERENCES captchas(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `post_filters` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `filter_json` text NOT NULL,
  `mode` int(1) NOT NULL COMMENT '0:disable, 1:audit, 2:enforce',
  PRIMARY KEY (`id`),
  KEY `mode` (`mode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `post_filter_hits` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `userhash` char(40) DEFAULT NULL,
  `ip_type` int NOT NULL COMMENT '0:ipv4, 1:ipv6',
  `ip_data` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  `filter_id` int UNSIGNED DEFAULT NULL,
  `blocked` int NOT NULL,
  `board` varchar(120) DEFAULT NULL,
  `successful_post_id` int UNSIGNED DEFAULT NULL,
  `thread` int(11) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `email` varchar(254) DEFAULT NULL,
  `name` varchar(75) DEFAULT NULL,
  `trip` varchar(25) DEFAULT NULL,
  `capcode` varchar(50) DEFAULT NULL,
  `filename` text DEFAULT NULL,
  `filehash` text DEFAULT NULL,
  `body_nomarkup` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userhash_time` (`userhash`, `timestamp`),
  KEY `ip_type_data` (`ip_type`, `ip_data`, `timestamp`),
  KEY `timestamp` (`timestamp`),
  FOREIGN KEY (filter_id)
    REFERENCES post_filters(id)
    ON DELETE SET NULL,
  FOREIGN KEY (board)
    REFERENCES boards(uri)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

--
-- Table structure for table `bans`
--

CREATE TABLE IF NOT EXISTS `bans` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `status` int(11) NOT NULL COMMENT '0:active, 1:expired, 2:lifted',
  `range_type` int(11) NOT NULL COMMENT '0:ipv4, 1:ipv6',
  `range_start` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  `range_end` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  `mod` int(11) NOT NULL COMMENT 'which mod made the ban',
  `set` int(11) NOT NULL COMMENT 'when the ban was set',
  `expires` int(11) DEFAULT NULL,
  `lifted` int(11) DEFAULT NULL,
  `reason` text,
  `board` varchar(120) DEFAULT NULL,
  `ban_type` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0:full, 1:image only',
  `seen` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY (`expires`),
  KEY `status_range` (`status`, `range_type`, `range_start`, `range_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `boards`
--

CREATE TABLE IF NOT EXISTS `boards` (
  `uri` varchar(120) NOT NULL,
  `title` tinytext NOT NULL,
  `subtitle` tinytext,
  PRIMARY KEY (`uri`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `boards`
--

INSERT INTO `boards` (`uri`, `title`, `subtitle`) VALUES
('b', 'Beta', 'In development.');

-- --------------------------------------------------------

--
-- Table structure for table `cites`
--

CREATE TABLE IF NOT EXISTS `cites` (
  `board` varchar(8) NOT NULL,
  `post` int(11) NOT NULL,
  `target_board` varchar(8) NOT NULL,
  `target` int(11) NOT NULL,
  KEY `target` (`target_board`,`target`),
  KEY `post` (`board`,`post`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `ip_notes`
--

CREATE TABLE IF NOT EXISTS `ip_notes` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `range_type` int(11) NOT NULL COMMENT '0:ipv4, 1:ipv6',
  `range_start` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  `range_end` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  `mod` int(11) DEFAULT NULL,
  `time` int(11) NOT NULL,
  `body` text NOT NULL,
  UNIQUE KEY `id` (`id`),
  KEY (`range_type`, `range_start`, `range_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `modlogs`
--

CREATE TABLE IF NOT EXISTS `modlogs` (
  `mod` int(11) NOT NULL,
  `ip_type` int(11) NOT NULL COMMENT '0:ipv4, 1:ipv6',
  `ip_data` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  `board` varchar(120) DEFAULT NULL,
  `time` int(11) NOT NULL,
  `text` text NOT NULL,
  `permission_level` smallint(1) NOT NULL DEFAULT 1 COMMENT 'Uses same permission hierarchy as defined in config',
  KEY `time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `mods`
--

CREATE TABLE IF NOT EXISTS `mods` (
  `id` smallint(6) UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` varchar(30) NOT NULL,
  `password` char(40) NOT NULL COMMENT 'SHA1',
  `type` smallint(1) NOT NULL COMMENT '0: janitor, 1: mod, 2: admin',
  `boards` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`,`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `mods`
--

INSERT INTO `mods` (`id`, `username`, `password`, `type`, `boards`) VALUES
(1, 'admin', '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8', 2, '*');

-- --------------------------------------------------------

--
-- Table structure for table `news`
--

CREATE TABLE IF NOT EXISTS `news` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `time` int(11) NOT NULL,
  `subject` text NOT NULL,
  `body` text NOT NULL,
  UNIQUE KEY `id` (`id`),
  KEY `time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `noticeboard`
--

CREATE TABLE IF NOT EXISTS `noticeboard` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `mod` int(11) NOT NULL,
  `time` int(11) NOT NULL,
  `subject` text NOT NULL,
  `body` text NOT NULL,
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `pms`
--

CREATE TABLE IF NOT EXISTS `pms` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `sender` int(11) NOT NULL,
  `to` int(11) NOT NULL,
  `message` text NOT NULL,
  `time` int(11) NOT NULL,
  `unread` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE IF NOT EXISTS `reports` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `time` int(11) NOT NULL,
  `ip_type` int(11) NOT NULL COMMENT '0:ipv4, 1:ipv6',
  `ip_data` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  `board` varchar(120) DEFAULT NULL,
  `post` int(11) NOT NULL,
  `reason` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `theme_settings`
--

CREATE TABLE IF NOT EXISTS `theme_settings` (
  `theme` varchar(40) NOT NULL,
  `name` varchar(40) DEFAULT NULL,
  `value` text,
  KEY `theme` (`theme`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
