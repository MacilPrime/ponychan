/* @flow */

import React from 'react';

import Title from '../common/Title';
import Menu from './Menu';

export default class Watcher extends React.PureComponent {
  render() {
    return (
      <Title title="Watcher">
        <div className="watcherPage homeblock">
          <Menu />
        </div>
      </Title>
    );
  }
}
