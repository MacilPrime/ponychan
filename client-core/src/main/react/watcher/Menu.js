/* @flow */

import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {unwatchThread} from './actions';

import watchedThreadsStateToList from './watchedThreadsStateToList';
import Thread from './Thread';

class Menu extends React.Component {
  render() {
    const {watcher, unwatchThread} = this.props;
    const threads = watchedThreadsStateToList(watcher.watchedThreads);
    const mod = watcher && watcher.lastResponse ? watcher.lastResponse.mod : null;

    const threadComponents = threads.map(thread => <Thread key={thread.id} thread={thread} onRemove={unwatchThread} />);

    const modSection = mod ? <section className="wmod">
      <h2>Moderator</h2>
      <ul className="wcontent">
        <li><a className="wlink" href="/mod.php?/reports"><span className="wreportcount">{mod.report_count}</span> reports</a></li>
        <li><a className="wlink" href="/mod.php?/bans"><span className="wappealscount">{mod.open_appeals_count}</span> open appeals</a></li>
      </ul>
    </section> : null;

    return (
      <div className="watcherMenu">
        {modSection}
        <section className="wthreads">
          <h2>Threads</h2>
          {threadComponents}
        </section>
      </div>
    );
  }
}

function mapStateToProps(state: Object) {
  return {watcher: state.watcher};
}

function mapDispatchToProps(dispatch: Function) {
  return bindActionCreators({unwatchThread}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Menu);
