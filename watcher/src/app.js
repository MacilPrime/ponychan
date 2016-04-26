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

import * as bans from './routes/bans';
import watcher from './routes/watcher';
import poll from './routes/poll';
import * as tasks from './routes/tasks';
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
app.set('trust proxy', true);
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

app.post('*', (req, res, next) => {
  const refererRegex = new RegExp(`^https?://${_.escapeRegExp(req.headers.host)}/`);
  if (!refererRegex.test(req.headers.referer)) {
    res.status(403).send('Invalid Referer header');
  } else {
    next();
  }
});

function modOnly(req, res, next) {
  res.setHeader("Cache-Control", "private");
  if (!req.mod) {
    res.sendStatus(403);
  } else {
    next();
  }
}

function scriptBasePage(pageId: string, title: string) {
  return (req, res) => {
    res.render('scriptBasePage.html', {pageId, title});
  };
}

app.all('/mod/*', modOnly);
app.all('/api/v1/mod/*', modOnly);

app.get('/mod/filters/*', scriptBasePage('modFilters', 'Filters'));

app.post('/api/v1/mod/filters/previews/', bodyParser.json(), filters.previewStart);
app.get ('/api/v1/mod/filters/previews/:id', filters.previewGet);

app.get ('/api/v1/mod/filters/', filters.getList);
app.post('/api/v1/mod/filters/', bodyParser.json(), filters.create);
app.get ('/api/v1/mod/filters/:id', filters.getOne);
app.post('/api/v1/mod/filters/:id', bodyParser.json(), filters.update);

app.get   ('/api/v1/tasks/:id', tasks.get);
app.delete('/api/v1/tasks/:id', tasks.del);

app.post('/bans/:id/appeal', bodyParser.urlencoded({extended: false}), bans.appeal);
app.post('/bans/:id/modappeal', bodyParser.urlencoded({extended: false}), bans.modappeal);

app.get('/watcher/', (req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=120");
  next();
}, scriptBasePage('watcher', 'Watcher'));
app.get('/watcher/threads', watcher);
app.get('/poll/', poll);

app.listen(config.listen.port, config.listen.host, function() {
  console.log(`Now listening on ${config.listen.host}:${config.listen.port}`);
});
