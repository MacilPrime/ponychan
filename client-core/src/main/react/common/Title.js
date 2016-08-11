/* @flow */

import React, {Children, PropTypes} from 'react';
import withSideEffect from 'react-side-effect';

class Title extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired
  };

  render() {
    if (this.props.children) {
      return Children.only(this.props.children);
    } else {
      return null;
    }
  }
}

function reducePropsToState(propsList) {
  const innermostProps = propsList[propsList.length - 1];
  if (innermostProps) {
    return innermostProps.title;
  }
}

function handleStateChangeOnClient(title: ?string) {
  if (title == null) return;
  document.title = title;
  const headerEl = document.querySelector('header h1');
  if (headerEl) {
    headerEl.textContent = title;
  }
}

export default withSideEffect(
  reducePropsToState,
  handleStateChangeOnClient
)(Title);
