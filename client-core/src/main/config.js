import {log_error} from './logger';

var BOARD_DATA;
try {
  // This is populated by getBoardConfig() in functions.php
  BOARD_DATA = JSON.parse(document.getElementById('config').getAttribute('data-board-config'));
} catch(err) {
  log_error(err);
  BOARD_DATA = {};
}

var config = {
  site: global.SITE_DATA,
  board: BOARD_DATA
};

export default config;
