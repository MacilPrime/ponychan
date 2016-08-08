/* @flow */

import {combineReducers} from 'redux';
import {routerReducer as routing} from 'react-router-redux';
import watcher from '../watcher/reducer';
import modFilters from '../mod-filters/reducer';

export default combineReducers({
  modFilters,
  routing,
  watcher
});
