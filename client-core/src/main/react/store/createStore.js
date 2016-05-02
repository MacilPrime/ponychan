import {compose, createStore, applyMiddleware} from 'redux';
import {routerMiddleware} from 'react-router-redux';

import reducers from './reducers';

export default (initialState = {}, history, DevTools) => {
  let middleware = applyMiddleware(routerMiddleware(history));

  if (DevTools) {
    middleware = compose(middleware, DevTools.instrument());
  }

  const store = createStore(reducers, initialState, middleware);

  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const reducers = require('./reducers').default;

      store.replaceReducer(reducers);
    });
  }

  return store;
};
