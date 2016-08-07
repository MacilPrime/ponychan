/* @flow */

import {log_error} from './logger';

let BOARD_DATA: Object = {};
if (global.document) {
  try {
    // This is populated by getBoardConfig() in functions.php
    BOARD_DATA = JSON.parse(document.getElementById('config').getAttribute('data-board-config'));
  } catch (err) {
    log_error(err);
  }
}

const config = {
  site: global.SITE_DATA,
  board: BOARD_DATA
};

export default config;
