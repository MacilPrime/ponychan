import {compose, createStore, applyMiddleware} from 'redux';
import {routerMiddleware} from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';

import saga from './saga';
import reducers from './reducers';

export default (initialState = {}, history, DevTools) => {
  const sagaMiddleware = createSagaMiddleware();
  let middleware = applyMiddleware(sagaMiddleware, routerMiddleware(history));

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

  sagaMiddleware.run(saga);

  return store;
};
