/* @flow */

import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';
import Title from '../common/Title';

import About from './show/About';
import Edit from './show/Edit';
import Hits from './show/Hits';

import {fetchFilterRequest} from './actions';

class ShowPage extends React.PureComponent {
  state = {
    page: 'about'
  };

  componentDidMount() {
    const id = +this.props.params.id;
    this.props.fetchFilterRequest(id);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.id != nextProps.params.id) {
      this.props.fetchFilterRequest(nextProps.params.id);
    }
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

    const {page} = this.state;

    return (
      <Title title="Filter">
        <div>
          <div>
            <Link to="/mod/filters/">Back to Filters Dashboard</Link>
          </div>
          <div>
            <button type="button" onClick={()=>this.setState({page:'about'})}
              style={{fontWeight: page === 'about' ? 'bold' : ''}}>
              About
            </button>
            <button type="button" onClick={()=>this.setState({page:'edit'})}
              style={{fontWeight: page === 'edit' ? 'bold' : ''}}>
              View/Edit
            </button>
            <button type="button" onClick={()=>this.setState({page:'hits'})}
              style={{fontWeight: page === 'hits' ? 'bold' : ''}}>
              Hits
            </button>
          </div>
          {
            page === 'about' ? <About filter={filter} /> :
            page === 'edit' ?
              <Edit
                isNewFilter={false} initialFilter={filter}
                /> :
            page === 'hits' ? <Hits filter={filter} /> :
            null
          }
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
