/* @flow */

import React from 'react';
import {Link} from 'react-router';
import filterModeName from '../filterModeName';

export default class About extends React.PureComponent {
  props: {
    filter: Object;
  };

  render() {
    const {filter} = this.props;
    return (
      <div>
        <div>Author: {filter.author_name}</div>
        <div>Mode: {filterModeName(filter.mode)}</div>
        <div>Hit count: {filter.hit_count}</div>
        { filter.parent != null &&
          <div>
            <Link to={`/mod/filters/${filter.parent}`}>Previous version ({filter.parent_timestamp})</Link>
          </div>
        }
        <div>
          Mode change history:
          {
            !filter.history ? <div>Loading...</div> :
            filter.history.length === 0 ? <div>None</div> :
            <ul>
              {
                filter.history.map((item, i) =>
                  <li key={i}>
                    {item.timestamp} {item.mod_name} {filterModeName(item.old_mode)}
                    {' -> '} {filterModeName(item.new_mode)}
                  </li>
                )
              }
            </ul>
          }
        </div>
      </div>
    );
  }
}
