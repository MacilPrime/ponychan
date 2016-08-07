/* @flow */

import React from 'react';
import {Link} from 'react-router';
import Title from '../common/Title';

export default class ModFilters extends React.Component {
  render() {
    return (
      <Title title="Filters Dashboard">
        <div>
          Mod-Filters stuff here<br />
          <Link to="/watcher">watcher</Link>
        </div>
      </Title>
    );
  }
}
