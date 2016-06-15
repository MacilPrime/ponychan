import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux'

import {unwatchThread} from './actions';

import Title from '../common/Title';
import Menu from './Menu';
import {make_thread_url, make_thread50_url} from '../../lib/url';

class Watcher extends React.Component {
  render() {
    const {watcher, unwatchThread} = this.props;

    const threads = Object.keys(watcher.watchedThreads).map(id => {
      const watchedThread = watcher.watchedThreads[id];

      const match = /^(\w+):(\d+)$/.exec(id);
      const board = match[1];
      const postnum = +match[2];
      let unread_hash = '';
      if (
        watchedThread.known_reply_count != null &&
        watchedThread.last_known_time > watchedThread.last_seen_time
      ) {
        unread_hash = '#unread';
      }

      return {
        ...watchedThread,
        id,
        board,
        postnum,
        url: make_thread_url(board, postnum)+unread_hash,
        url50: watchedThread.known_reply_count > 100 ?
          make_thread50_url(board, postnum)+unread_hash : null
      };
    });

    const mod = watcher && watcher.lastResponse ? watcher.lastResponse.mod : null;

    return (
      <Title title="Watcher">
        <div className="watcherPage homeblock">
          <Menu
            mod={mod}
            threads={threads}
            onRemove={unwatchThread}
            />
        </div>
      </Title>
    );
  }

  shouldComponentUpdate(prevProps) {
    return prevProps.watcher.watchedThreads !== this.props.watcher.watchedThreads ||
      prevProps.watcher.lastResponse !== this.props.watcher.lastResponse;
  }
}

function mapStateToProps(state) {
  return {watcher: state.watcher};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({unwatchThread}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Watcher);
