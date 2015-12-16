/* @flow */
//jshint ignore:start

import _ from 'lodash';
import crypto from 'crypto';
import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import swig from 'swig';
import RSVP from 'rsvp';

import config from './config';

import setUserhash from './setUserhash';
import checkMod from './checkMod';
import cachebust from './util/cachebust';

import watcher from './routes/watcher';
import poll from './routes/poll';
import * as filters from './routes/filters';

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

app.all('/mod/*', (req, res, next) => {
  res.setHeader("Cache-Control", "private");
  if (!req.mod) {
    res.sendStatus(403);
  } else {
    next();
  }
});

app.post('/mod/filters/', bodyParser.json(), filters.create);
app.post('/mod/filters/previews/', bodyParser.json(), filters.preview);
app.get('/mod/filters/', filters.getList);
app.get('/mod/filters/:id', filters.getOne);
app.post('/mod/filters/:id', bodyParser.json(), filters.update);
app.get('/watcher/', (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=120");
  res.render('watcher.html');
});
app.get('/watcher/threads', watcher);
app.get('/poll/', poll);

app.listen(config.listen.port, config.listen.host, function() {
  console.log(`Now listening on ${config.listen.host}:${config.listen.port}`);
});
