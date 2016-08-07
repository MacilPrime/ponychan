/* @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import {Router, browserHistory} from 'react-router';

import {createDevTools} from 'redux-devtools';
import LogMonitor from 'redux-devtools-log-monitor';
import DockMonitor from 'redux-devtools-dock-monitor';

import {Provider} from 'react-redux';
import {syncHistoryWithStore} from 'react-router-redux';

import routes from './routes';
import createStore from './store/createStore';
import {documentReady} from '../lib/events';

import setupWatcherButton from './watcher/setupWatcherButton';

const DevTools = process.env.NODE_ENV === 'production' ? null : createDevTools(
  <DockMonitor defaultIsVisible={false} toggleVisibilityKey="ctrl-h" changePositionKey="ctrl-q">
    <LogMonitor theme="tomorrow" preserveScrollTop={false} />
  </DockMonitor>
);

export const {store, actionLog} = createStore(
  undefined, browserHistory, DevTools
);

documentReady.onValue(() => {
  const element = document.getElementById('scriptBasePage');
  if (element) {
    const history = syncHistoryWithStore(browserHistory, store);

    ReactDOM.render(
      <Provider store={store}>
        <div>
          <Router history={history}>
            {routes}
          </Router>
          {DevTools && <DevTools />}
        </div>
      </Provider>,
      element
    );
  } else if (DevTools) {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    ReactDOM.render(
      <Provider store={store}>
        <DevTools />
      </Provider>,
      mount
    );
  }

  setupWatcherButton(store);
});
