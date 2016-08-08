/* @flow */

import React from 'react';
import Title from '../common/Title';

export default class ShowPage extends React.PureComponent {
  render() {
    const {id} = this.props.params;

    return (
      <Title title="Filter">
        <div>
          foo {id}
        </div>
      </Title>
    );
  }
}
