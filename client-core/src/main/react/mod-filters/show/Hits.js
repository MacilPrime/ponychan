/* @flow */

import React from 'react';

import ipToUserRange from '../../../lib/ipToUserRange';

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
        <div>
          <a href={`/mod.php?/IP/${ipToUserRange(hit.ip)}`}>{hit.ip}</a>
        </div>
        <pre style={{whiteSpace:'pre-wrap'}}>
          {JSON.stringify(hit,null,2)}
        </pre>
      </li>
    );

    return (
      <div>
        <div>
          Total hits: {filter.hit_count}
        </div>
        <div style={{display: filter.hit_count === filter.hits.length ? 'none' : ''}}>
          Showing {filter.hits.length}
        </div>
        <ul>
          {entries}
        </ul>
      </div>
    );
  }
}
