/* @flow */
//jshint ignore:start

import _ from 'lodash';
import crypto from 'crypto';
import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swig from 'swig';
import RSVP from 'rsvp';

import config from './config';

import setUserhash from './setUserhash';
import checkMod from './checkMod';
import cachebust from './util/cachebust';

import watcher from './routes/watcher';
import poll from './routes/poll';

RSVP.on('error', function(err) {
  console.error('uncaught RSVP promise rejection');
  throw err;
});

const app = express();

if (process.env.NODE_ENV !== 'production') {
  app.set('json spaces', 2);
  swig.setDefaults({ cache: false });
}
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/../views');

swig.setFilter('cachebust', cachebust);

app.locals.boardlist = config.board.boardlist;

app
  .use(morgan('combined'))
  .use(cookieParser())
  .use(setUserhash)
  .use(checkMod);

app.get('/watcher/', (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=120");
  res.render('watcher.html');
});
app.get('/watcher/threads', watcher);
app.get('/poll/', poll);

app.listen(config.listen.port, config.listen.host, function() {
  console.log(`Now listening on ${config.listen.host}:${config.listen.port}`);
});
