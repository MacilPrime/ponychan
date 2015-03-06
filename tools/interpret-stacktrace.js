#!/usr/bin/env node
'use strict';

var _ = require ('lodash');
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var fs = require('fs');
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

var getSourceMapForVersion = _.memoize(function(version) {
  return new SourceMapConsumer(JSON.parse(
    fs.readFileSync(__dirname+'/../core/js/maps/'+version+'/main.js.map', 'utf8')));
});

function parseMessage(msg) {
  var version = msg.data.version;
  var sourcemap = getSourceMapForVersion(version);
  var stack = msg.data.stack;
  var interpretedStack = stack.replace(
    /(https:\/\/mlpchan\.net\/js\/main\.js(?:\?[^:]*)):(\d+):(\d+)/g,
    function(full, url, line, column) {
      line = +line;
      column = +column;
      var origPos = sourcemap.originalPositionFor({line: line, column: column});
      return origPos.source+':'+origPos.line+':'+origPos.column;
    }
  );
  console.log(interpretedStack);
}

rl.on('line', function (line) {
  if (!line.trim())
    return;
  var msg;
  try {
    msg = JSON.parse(line);
  } catch(e) {
    console.error("Failed to parse line");
    return;
  }
  parseMessage(msg);
});
