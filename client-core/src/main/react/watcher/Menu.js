import React from 'react';

import Thread from './Thread';

export default class Menu extends React.Component {
  static propTypes = {
    mod: React.PropTypes.object,
    threads: React.PropTypes.array.isRequired,
    onRemove: React.PropTypes.func.isRequired
  };
  render() {
    const {mod, threads, onRemove} = this.props;
    const threadComponents = threads.map(thread => <Thread key={thread.id} thread={thread} onRemove={onRemove} />);

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
