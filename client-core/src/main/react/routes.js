/* @flow */

import React from 'react';
import {Route} from 'react-router';

/* containers */
import Watcher from './watcher';
import ModFilters from './mod-filters';

export default (
  <Route path="/" component={props => props.children}>
    <Route path="watcher" component={Watcher} />
    <Route path="mod/filters" component={ModFilters} />
  </Route>
);
