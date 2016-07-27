import React from 'react';
import cx from 'classnames';
import {connect} from 'react-redux';
import config from '../../config';

class ButtonLabel extends React.Component {
  render() {
    const {onClick, opened, watcher} = this.props;

    if (!opened && !watcher.isMod && Object.keys(watcher.watchedThreads).length == 0) {
      return null;
    }

    const watcherAlerts = watcher.alerts ?
      <span className="watcherAlerts">({watcher.alerts})</span>
      : null;

    return (
      <a
        className={cx('watcherButton', {open: opened})}
        href={config.site.siteroot+'watcher'}
        onClick={onClick}
        >
        {watcherAlerts}watcher
      </a>
    );
  }
}

function mapStateToProps(state) {
  return {watcher: state.watcher};
}

export default connect(mapStateToProps)(ButtonLabel);
