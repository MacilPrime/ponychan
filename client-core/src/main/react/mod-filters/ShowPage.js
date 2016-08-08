/* @flow */

import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Title from '../common/Title';

import {fetchFilterRequest} from './actions';

class ShowPage extends React.PureComponent {
  componentDidMount() {
    const id = +this.props.params.id;
    this.props.fetchFilterRequest(id);
  }

  render() {
    const id = +this.props.params.id;
    if (isNaN(id)) {
      return (
        <Title title="Error">
          <div>
            That is not a valid filter id.
          </div>
        </Title>
      );
    }

    const {filter} = this.props;
    if (!filter) {
      return (
        <Title title="Filter">
          <div>
            Loading...
          </div>
        </Title>
      );
    }

    return (
      <Title title="Filter">
        <div>
          foo {filter.id} {filter.author_name}<br />
          <pre>{JSON.stringify(filter,null,2)}</pre>
        </div>
      </Title>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const id = +ownProps.params.id;
  return {
    filter: state.modFilters.filtersById[id]
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({fetchFilterRequest}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowPage);
