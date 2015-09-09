//jshint ignore:start

import cx from 'classnames';
import Immutable from 'immutable';
import React from 'react/addons';
const PureRenderMixin = React.addons.PureRenderMixin;

export const WatcherMenu = React.createClass({
	mixins: [PureRenderMixin],
	propTypes: {
		mod: React.PropTypes.object,
		threads: React.PropTypes.array.isRequired,
		onRemove: React.PropTypes.func.isRequired
	},
	render() {
		var {mod, threads, onRemove} = this.props;
		var threadComponents = threads.map(thread => <Thread key={thread.id} thread={thread} onRemove={onRemove} />);

		var modSection = mod ? <section className="wmod">
			<h2>Moderator</h2>
			<div className="wcontent">
				<a className="wlink" href="?/reports"><span className="wreportcount">{mod.report_count}</span> reports</a>
			</div>
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
});

export const Thread = React.createClass({
	mixins: [PureRenderMixin],
	propTypes: {
		thread: React.PropTypes.object.isRequired,
		onRemove: React.PropTypes.func.isRequired
	},
	_remove() {
		var {thread, onRemove} = this.props;
		onRemove(thread.id);
	},
	render() {
		var {thread} = this.props;
		var postCounter;
		if (thread.known_reply_count == null) {
			postCounter = <span className="wpostcounter">
				(<span className="wcounterror">Thread not found</span>)
			</span>;
		} else {
			if (thread.last_known_time > thread.last_seen_time) {
				var newCount = (thread.known_reply_count > thread.seen_reply_count) ?
					thread.known_reply_count-thread.seen_reply_count : 'unknown';
				postCounter = <span className="wpostcounter">
					(
					<span className="wallposts">
						{thread.known_reply_count} posts
					</span>
					/
					<span className="wnewposts">
						{newCount} new
					</span>
					)
				</span>;

			} else {
				postCounter = <span className="wpostcounter">
					(<span className="wallposts">{thread.known_reply_count} posts</span>)
				</span>;
			}
		}
		return (<div className="wthread">
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
				<a className="wremove" href="javascript:;" onClick={this._remove}>X</a>
			</div>
			<div className="wdetails">
				<span className="wsubject">{thread.subject}</span>
				{' — '}
				<span className="wpost">{thread.post}</span>
			</div>
		</div>);
	}
});
