/* @flow */

import {combineReducers} from 'redux';
import {routerReducer as routing} from 'react-router-redux';
import watcher from '../watcher/reducer';

export default combineReducers({
  routing,
  watcher
});
