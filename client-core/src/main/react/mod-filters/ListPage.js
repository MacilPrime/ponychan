/* @flow */

import React from 'react';
import {Link} from 'react-router';
import Title from '../common/Title';
import FilterList from './FilterList';

export default class ListPage extends React.PureComponent {
  render() {
    return (
      <Title title="Filter List">
        <div>
          <div>
            <Link to="/mod/filters/">Back to Filters Dashboard</Link>
          </div>
          <div>
            <FilterList />
          </div>
        </div>
      </Title>
    );
  }
}
