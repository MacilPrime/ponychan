/* @flow */

import React from 'react';
import {Route} from 'react-router';

/* containers */
import Watcher from './watcher';
import ModFiltersDashboard from './mod-filters/Dashboard';
import ModFiltersListPage from './mod-filters/ListPage';

export default (
  <Route path="/" component={props => props.children}>
    <Route path="watcher" component={Watcher} />
    <Route path="mod/filters/" component={ModFiltersDashboard} />
    <Route path="mod/filters/list" component={ModFiltersListPage} />
  </Route>
);
