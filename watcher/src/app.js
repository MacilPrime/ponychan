/* @flow */
//jshint ignore:start

import _ from 'lodash';
import crypto from 'crypto';
import express from 'express';
import swig from 'swig';
import RSVP from 'rsvp';

import config from './config';

import setUserhash from './setUserhash';
import checkMod from './checkMod';

import watcher from './routes/watcher';

RSVP.on('error', function(err) {
  console.error('uncaught RSVP promise rejection');
  throw err;
});

const app = express();

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/../views');

app
  .use(express.logger())
  .use(express.cookieParser())
  .use(setUserhash)
  .use(checkMod);

app.get('/watcher/threads', watcher);

app.listen(config.listen.port, config.listen.host, function() {
  console.log(`Now listening on ${config.listen.host}:${config.listen.port}`);
});
