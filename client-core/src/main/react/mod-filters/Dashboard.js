/* @flow */

import React from 'react';
import {Link} from 'react-router';
import Title from '../common/Title';

export default class Dashboard extends React.PureComponent {
  render() {
    return (
      <Title title="Filters Dashboard">
        <div>
          <Link to="/mod/filters/list">Filter List</Link>
        </div>
      </Title>
    );
  }
}
