/* @flow */

import React from 'react';

import Title from '../common/Title';
import Menu from './Menu';

export default class Watcher extends React.Component {
  render() {
    return (
      <Title title="Watcher">
        <div className="watcherPage homeblock">
          <Menu />
        </div>
      </Title>
    );
  }

  shouldComponentUpdate() {
    return false;
  }
}
