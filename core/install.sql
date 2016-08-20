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
  `ban_type` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0:full, 1:image only, 2:thread starting',
  `seen` tinyint(1) NOT NULL,
  `signed_name` VARCHAR(75) NULL,
  `signed_trip` VARCHAR(25) NULL,
  `appealable` int(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY (`expires`),
  KEY `range` (`range_type`, `range_start`, `range_end`),
  KEY `status_range` (`status`, `range_type`, `range_start`, `range_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

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
  `signed_name` VARCHAR(75) DEFAULT NULL,
  `signed_trip` VARCHAR(25) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`username`)
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


CREATE TABLE IF NOT EXISTS `needs_captcha` (
  `uuid` char(36) NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ip_type` int NOT NULL COMMENT '0:ipv4, 1:ipv6',
  `ip_data` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  KEY `ip_type_data` (`ip_type`, `ip_data`, `timestamp`),
  KEY `timestamp` (`timestamp`),
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `solved_captcha` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ip_type` int NOT NULL COMMENT '0:ipv4, 1:ipv6',
  `ip_data` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  PRIMARY KEY (`id`),
  KEY `ip_type_data` (`ip_type`, `ip_data`, `timestamp`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `post_filters` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `filter_json` text NOT NULL,
  `mode` int(1) NOT NULL COMMENT '0:disable, 1:audit, 2:enforce',
  `author` smallint UNSIGNED DEFAULT NULL,
  `parent` int UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY (`mode`),
  KEY (`author`),
  KEY (`parent`),
  FOREIGN KEY (`author`)
    REFERENCES mods(`id`)
    ON DELETE SET NULL,
  FOREIGN KEY (`parent`)
    REFERENCES post_filters(`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

-- Currently only for tracking mode changes. filter_json values in post_filters
-- should be treated as immutable.
CREATE TABLE IF NOT EXISTS `post_filter_changes` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `filter_id` int UNSIGNED NOT NULL,
  `mod` smallint UNSIGNED DEFAULT NULL,
  `old_mode` int(1) DEFAULT NULL,
  `new_mode` int(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (filter_id)
    REFERENCES post_filters(id)
    ON DELETE CASCADE,
  FOREIGN KEY (`mod`)
    REFERENCES mods(`id`)
    ON DELETE SET NULL
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

CREATE TABLE IF NOT EXISTS `users` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  PRIMARY KEY(`id`),
  UNIQUE KEY(`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `user_ips` (
  `user_id` int UNSIGNED NOT NULL,
  `range_type` int(11) NOT NULL COMMENT '0:ipv4, 1:ipv6',
  `range_start` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  `range_end` varbinary(16) NOT NULL COMMENT 'INET6_ATON() address data',
  PRIMARY KEY(`range_type`, `range_start`, `range_end`),
  FOREIGN KEY (`user_id`)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `user_userhashes` (
  `user_id` int UNSIGNED NOT NULL,
  `userhash` char(40) NOT NULL,
  PRIMARY KEY(`userhash`),
  FOREIGN KEY (`user_id`)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `user_tripcodes` (
  `user_id` int UNSIGNED NOT NULL,
  `trip` varchar(25) NOT NULL,
  PRIMARY KEY(`trip`),
  FOREIGN KEY (`user_id`)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `polls` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `poll_eligible_users` (
  `poll_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  PRIMARY KEY (`poll_id`, `user_id`),
  FOREIGN KEY (`poll_id`)
    REFERENCES polls(id)
    ON DELETE CASCADE,
  FOREIGN KEY (`user_id`)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `poll_questions` (
  `poll_id` int UNSIGNED NOT NULL,
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`poll_id`)
    REFERENCES polls(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `poll_results` (
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `poll_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `question_id` int UNSIGNED NOT NULL,
  `answer` int UNSIGNED NOT NULL,
  PRIMARY KEY (`poll_id`, `user_id`, `question_id`),
  KEY (`user_id`),
  FOREIGN KEY (`poll_id`, `user_id`)
    REFERENCES poll_eligible_users(poll_id, user_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (`poll_id`)
    REFERENCES polls(id)
    ON DELETE CASCADE,
  FOREIGN KEY (`poll_id`, `question_id`)
    REFERENCES poll_questions(poll_id, id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `ban_appeals` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ban` int(11) UNSIGNED NOT NULL,
  `is_user` int(1) NOT NULL,
  `mod` smallint UNSIGNED DEFAULT NULL,
  `name` varchar(75) DEFAULT NULL,
  `trip` varchar(25) DEFAULT NULL,
  `capcode` varchar(50) DEFAULT NULL,
  `body` text NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`ban`)
    REFERENCES bans(`id`)
    ON DELETE CASCADE,
  FOREIGN KEY (`mod`)
    REFERENCES mods(`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
