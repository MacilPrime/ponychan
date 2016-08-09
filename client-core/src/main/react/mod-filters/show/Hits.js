/* @flow */

import React from 'react';

export default class Edit extends React.PureComponent {
  props: {
    filter: Object;
  };

  render() {
    const {filter} = this.props;
    const {hits} = filter;

    if (!hits) {
      return <div>Loading...</div>;
    }

    const entries = hits.map(hit =>
      <li key={hit.id}>
        <pre>
          {JSON.stringify(hit,null,2)}
        </pre>
      </li>
    );

    return (
      <div>
        {entries}
      </div>
    );
  }
}
