/* @flow */

import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {fetchListRequest} from './actions';

class FilterList extends React.PureComponent {
  componentDidMount() {
    this.props.fetchListRequest();
  }

  render() {
    const list = this.props.modFilters.filterList.map(filter =>
      <tr key={filter.id}>
        <td>foo</td>
        <td><pre>{ JSON.stringify(filter,null,2) }</pre></td>
      </tr>
    );

    return (
      <div>
        [Filter List]
        <table>
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
