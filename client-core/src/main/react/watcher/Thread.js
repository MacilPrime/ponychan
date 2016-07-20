import React from 'react';

export default class Thread extends React.Component {
  static propTypes = {
    thread: React.PropTypes.object.isRequired,
    onRemove: React.PropTypes.func.isRequired
  };
  _remove() {
    const {thread, onRemove} = this.props;
    onRemove(thread.id);
  }
  render() {
    const {thread} = this.props;
    let postCounter;
    if (thread.seen_reply_count == null && thread.known_reply_count == null) {
      postCounter = (
        <span className="wpostcounter">
          (Not loaded yet)
        </span>
      );
    } else if (thread.known_reply_count == null) {
      postCounter = (
        <span className="wpostcounter">
          (<span className="wcounterror">Thread not found</span>)
        </span>
      );
    } else {
      if (thread.last_known_time > thread.last_seen_time) {
        const newCount = (thread.known_reply_count > thread.seen_reply_count) ?
          thread.known_reply_count-thread.seen_reply_count : 'unknown';
        postCounter = (
          <span className="wpostcounter">
            (
            <span className="wallposts">
              {thread.known_reply_count} posts
            </span>
            /
            <span className="wnewposts">
              {newCount} new
            </span>
            )
          </span>
        );

      } else {
        postCounter = (
          <span className="wpostcounter">
            (<span className="wallposts">{thread.known_reply_count} posts</span>)
          </span>
        );
      }
    }
    return (
      <div className="wthread">
        <div className="wtop">
          <span className="wlinkpart">
            <a className="wlink" href={thread.url}>/{thread.board}/{thread.postnum}</a>
            { thread.url50 ? ' ' : null }
            { thread.url50 ? <a className="wlink" href={thread.url50}>+50</a> : null }
          </span>
          {' '}
          <span className="wname">{thread.opname}</span>
          <span className="wtrip">{thread.optrip}</span>
          {' '}
          {postCounter}
          {' '}
          <button
            type="button"
            aria-label="Remove"
            onClick={() => this._remove()}
            className="wremove">
            X
          </button>
        </div>
        <div className="wdetails">
          <span className="wsubject">{thread.subject}</span>
          {' — '}
          <span className="wpost">{thread.post}</span>
        </div>
      </div>
    );
  }
}
