/* @flow */

import React from 'react';

export default class About extends React.PureComponent {
  props: {
    filter: Object;
  };

  render() {
    const {filter} = this.props;
    return (
      <div>
        <div>Author: {filter.author_name}</div>
        <pre>{JSON.stringify(filter,null,2)}</pre>
      </div>
    );
  }
}
