CREATE TABLE IF NOT EXISTS `posts_{{ board }}` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `thread` int(11) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `email` varchar(254) DEFAULT NULL,
  `name` varchar(75) DEFAULT NULL,
  `trip` varchar(25) DEFAULT NULL,
  `capcode` varchar(50) DEFAULT NULL,
  `body` text NOT NULL,
  `body_nomarkup` text DEFAULT NULL,
  `time` int(11) NOT NULL,
  `bump` int(11) DEFAULT NULL,
  `thumb` varchar(50) DEFAULT NULL,
  `thumbwidth` int(11) DEFAULT NULL,
  `thumbheight` int(11) DEFAULT NULL,
  `file` varchar(50) DEFAULT NULL,
  `filewidth` int(11) DEFAULT NULL,
  `fileheight` int(11) DEFAULT NULL,
  `filesize` int(11) DEFAULT NULL,
  `filename` text DEFAULT NULL,
  `filehash` text DEFAULT NULL,
  `password` varchar(20) DEFAULT NULL,
  `ip` varchar(45) NOT NULL,
  `sticky` int(1) NOT NULL,
  `locked` int(1) NOT NULL,
  `sage` int(1) NOT NULL,
  `embed` text,
  `mature` int(1) NOT NULL,
  UNIQUE KEY `id` (`id`),
  KEY `thread_id` (`thread`, `id`),
  KEY `ip` (`ip`),
  KEY `time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1 ;
