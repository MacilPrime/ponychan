/*
 * logger.js
 *
 * Released under the MIT license
 * Copyright (c) 2014 Macil Tech <maciltech@gmail.com>
 *
 */

import $ from 'jquery';
import settings from './settings';
import RSVP from 'rsvp';

function basicStringHash(string, prevHash) {
  let hash = 0;
  if (prevHash)
    hash = prevHash;
  if (string.length == 0) return hash;
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i);
    hash = ((hash<<5)-hash)+char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function hashCode(x, prevHash) {
  if (typeof x === 'object' && x !== null) {
    let hash = 0;
    if (prevHash)
      hash = prevHash;

    const keys = [];
    $.each(x, (key) => {
      keys.push(key);
    });
    keys.sort();

    hash = basicStringHash('object:len:'+keys.length, hash);
    $.each(keys, function(i, key) {
      hash = basicStringHash(';'+i+key+':', hash);
      hash = hashCode(x[key], hash);
    });
    return hash;
  } else {
    return basicStringHash((typeof x)+':'+x, prevHash);
  }
}

function createID() {
  let id = '';
  const hexDigits = '0123456789abcdef';
  for (let i = 0; i < 32; i++) {
    id += hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  return id;
}

let userid;
if (typeof localStorage != 'undefined' && !!localStorage) {
  userid = localStorage.getItem('userid');
}
if (!userid || userid.length != 32) {
  userid = createID();
  try {
    localStorage.setItem('userid', userid);
  } catch (e) {
    console.error(e); //eslint-disable-line no-console
  }
}

const expires = new Date();
expires.setTime((new Date()).getTime()+60480000000);
document.cookie = 'userid='+escape(userid)+'; expires='+expires.toGMTString()+'; path='+global.SITE_DATA.siteroot;

const maxRetryTime = 3*60*1000;
const logger_url = global.SITE_DATA.siteroot + 'logger.php';

let noSendBefore = 0;
let noSendDelay = 10;
let send_queued = 0;
const send_maxQueued = 7;
const malformed_errors = {};

function error_to_object(error) {
  const newError = {
    message: error.message,
    url: error.fileName,
    lineNumber: error.lineNumber,
    columnNumber: error.columnNumber,
    stack: error.stack
  };
  if (error.constructor && error.constructor.name)
    newError.type = error.constructor.name;
  // get anything missed. For some reason error.message doesn't show up in this pass.
  for (let prop in error) {
    if (!error.hasOwnProperty(prop)) continue;
    let newProp;
    if (prop == 'fileName')
      newProp = 'url';
    else
      newProp = prop;
    newError[newProp] = error[prop];
  }
  return newError;
}

function send_error(error, retryTime) {
  if (typeof error === 'string')
    error = {message: error};
  else if (error instanceof Error)
    error = error_to_object(error);

  error.pageurl = document.location.href;
  error.version = process.env.VERSION;
  const errorString = JSON.stringify(error);
  const data = {type: 'error', userid: userid, data: errorString};

  if (
    !error.hasOwnProperty('message') &&
    !malformed_errors.hasOwnProperty(errorString)
  ) {
    malformed_errors[errorString] = true;
    log_error('send_error called without error.message');
  }

  const now = (new Date()).getTime();
  if (now < noSendBefore) {
    if (send_queued < send_maxQueued) {
      send_queued++;
      setTimeout(() => {
        send_queued--;
        send_error(error, retryTime);
      }, noSendBefore-now+10);
    }
    return;
  }

  if (!retryTime)
    retryTime = 3*1000;
  else if (retryTime > maxRetryTime)
    retryTime = maxRetryTime;

  noSendBefore = now + noSendDelay;

  noSendDelay *= 2;
  if (noSendDelay > maxRetryTime)
    noSendDelay = maxRetryTime;

  /* eslint-disable no-console */
  $.ajax({
    url: logger_url,
    cache: false,
    data: data,
    type: 'POST',
    success: function() {
      console.log('sent javascript error report to server for review');
    },
    error: function(jqXHR, textStatus, errorThrown) {
      if (textStatus == 'timeout') {
        console.log('timeout while trying to send error report, retrying soon');
        setTimeout(() => {
          send_error(error, retryTime*2);
        }, retryTime);
      } else {
        console.error('could not send error report. textStatus: '+textStatus+', errorThrown: '+errorThrown);
      }
    }
  });
}

export function log_error(error) {
  console.error(error);
  send_error(error);
}

RSVP.on('error', e => {
  log_error(e);
});

const old_onerror = window.onerror;

let error_handler_nest_count = 0;
window.onerror = function(errorMsg, url, lineNumber, columnNumber, error) {
  if (error_handler_nest_count <= 1) {
    error_handler_nest_count++;

    if (error) {
      error.caughtBy = 'window.onerror with error object';
      send_error(error);
    } else {
      const errorObj = {
        message: errorMsg,
        url: url,
        lineNumber: lineNumber,
        columnNumber: columnNumber,
        caughtBy: 'window.onerror'
      };
      send_error(errorObj);
    }

    error_handler_nest_count--;
  }
  if (old_onerror)
    return old_onerror.apply(this, arguments);
  return false;
};

function send_usage(retryTime) {

  // localStorage is used to know if we've already sent in a
  // usage report to not spam the system.
  if (!window.localStorage) return;

  const usage = {};

  usage.settings = settings.getAllSettingValues(true);

  usage.supportFile = typeof FileReader != 'undefined' && !!FileReader;
  usage.supportFormData = typeof FormData != 'undefined' && !!FormData;
  usage.supportPostMessage = typeof window.postMessage != 'undefined' && !!window.postMessage;
  usage.supportWorker = typeof Worker != 'undefined' && !!Worker;
  usage.supportSharedWorker = typeof SharedWorker != 'undefined' && !!SharedWorker;
  usage.supportWindowScrollTo = typeof window.scrollTo != 'undefined' && !!window.scrollTo;
  usage.supportCanvas = !!window.HTMLCanvasElement;
  usage.supportVisibility = global.Visibility.isSupported();

  const wURL = window.URL || window.webkitURL;
  usage.supportwURL = typeof wURL != 'undefined' && !!wURL;

  usage.supportGetSelection = typeof window.getSelection != 'undefined' && !!window.getSelection;

  // usage object construction end

  const last_usage_hash_key = 'last_usage_data:'+global.SITE_DATA.siteroot;

  const usageHash = hashCode(userid + hashCode(usage));
  if (usageHash == localStorage.getItem(last_usage_hash_key))
    return;

  const usageString = JSON.stringify(usage);

  const data = {type: 'usage', userid: userid, data: usageString};

  if (!retryTime)
    retryTime = 3*1000;
  else if (retryTime > maxRetryTime)
    retryTime = maxRetryTime;

  $.ajax({
    url: logger_url,
    cache: false,
    data: data,
    type: 'POST',
    success() {
      try {
        localStorage.setItem(last_usage_hash_key, usageHash);
      } catch (e) {
        // allow to fail
      }
    },
    error(jqXHR, textStatus) {
      if (textStatus == 'timeout') {
        setTimeout(function() {
          send_usage(retryTime*2);
        }, retryTime);
      }
    }
  });
}

function send_misc(misc, retryTime) {
  if (typeof misc !== 'object') {
    misc = {value: misc};
  }
  misc.pageurl = document.location.href;
  const miscString = JSON.stringify(misc);
  const data = {type: 'misc', userid: userid, data: miscString};

  if (!retryTime)
    retryTime = 3*1000;
  else if (retryTime > maxRetryTime)
    retryTime = maxRetryTime;

  $.ajax({
    url: logger_url,
    cache: false,
    data: data,
    type: 'POST',
    success: function() {
      //console.log("sent misc message to server");
    },
    error: function(jqXHR, textStatus, errorThrown) {
      if (textStatus == 'timeout') {
        console.log('timeout while trying to send misc message, retrying soon');
        setTimeout(function() {
          send_misc(misc, retryTime*2);
        }, retryTime);
      } else {
        console.error('could not send misc message. textStatus: '+textStatus+', errorThrown: '+errorThrown);
      }
    }
  });
}

let _misc_log_rapid_data = [];
let _misc_log_rapid_timer = null;
export function misc_log_rapid(data) {
  _misc_log_rapid_data.push([Date.now(), data]);

  if (!_misc_log_rapid_timer) {
    _misc_log_rapid_timer = setTimeout(() => {
      send_misc({type:'rapid', log:_misc_log_rapid_data});
      _misc_log_rapid_timer = null;
      _misc_log_rapid_data = [];
    }, 15*1000);
  }
}

$(document).ready(function() {
  setTimeout(send_usage, 300);
});
