import {compose, createStore, applyMiddleware} from 'redux';
import {routerMiddleware} from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
import {createActionLog} from 'redux-action-log';

import saga from './saga';
import reducers from './reducers';

export default (initialState = {}, history, DevTools) => {
  const actionLog = createActionLog({limit: 100});

  const sagaMiddleware = createSagaMiddleware();
  let enhancer = applyMiddleware(sagaMiddleware, routerMiddleware(history));

  if (DevTools) {
    enhancer = compose(enhancer, actionLog.enhancer, DevTools.instrument());
  }

  const store = createStore(reducers, initialState, enhancer);

  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const reducers = require('./reducers').default;

      store.replaceReducer(reducers);
    });
  }

  sagaMiddleware.run(saga);

  return {store, actionLog};
};
