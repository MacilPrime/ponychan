/* @flow */

import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';
import moment from 'moment';
import filterModeName from './filterModeName';

import {fetchListRequest} from './actions';

class FilterList extends React.PureComponent {
  componentDidMount() {
    this.props.fetchListRequest();
  }

  render() {
    const filters = _.chain(this.props.modFilters.filtersById)
      .values()
      .sortBy(filter => -filter.id)
      .value();
    const list = filters.map(filter => {
      const t = moment(filter.timestamp);
      return (
        <tr key={filter.id}>
          <td>{ null/*'[+]' TODO expand button here */}</td>
          <td><Link to={`/mod/filters/${filter.id}`}>{'->'}</Link></td>
          <td title={t.format()}>{t.format('Y-MM-DD')}</td>
          <td>{filter.author_name}</td>
          <td>{filterModeName(filter.mode)}</td>
          <td>{filter.hit_count}</td>
          <td>{filter.action.type}</td>
          <td>TODO</td>
        </tr>
      );
    });

    return (
      <div>
        <table>
          <thead>
            <tr>
              <td colSpan={2}></td>
              <td>Date</td>
              <td>Author</td>
              <td>Mode</td>
              <td>Hits</td>
              <td>Action</td>
              <td>Conditions</td>
            </tr>
          </thead>
          <tbody>
            {list}
          </tbody>
        </table>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {modFilters: state.modFilters};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({fetchListRequest}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FilterList);
