/* @flow */

import _ from 'lodash';
import React from 'react';
import {withRouter} from 'react-router';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as uuid from 'uuid';
import {
  fetchFilterRequest,
  previewFilterRequest,
  clearPreviewedFilter,
  updateFilterRequest,
} from '../actions';
import type {State as RState} from '../reducer';

import update from 'react-addons-update';

import ConditionRow from './edit/ConditionRow';
import Action from './edit/Action';

// TODO Some notes about what's not pretty about this:
// * These tabs probably should be routes.
// * Doesn't warn if you try to navigate away. Which would require it to be a route.
// * Too much local state? Probably should be handled more in redux.
type Props = {
  isNewFilter: boolean;
  initialFilter: Object;

  previewFilterRequestRunning: RState.previewFilterRequestRunning;
  previewFilterResponse: RState.previewFilterResponse;
  previewFilterLastError: RState.previewFilterLastError;
  updateRequestsRunning: RState.updateRequestsRunning;
  updateRequestsResponses: RState.updateRequestsResponses;
  updateRequestsErrors: RState.updateRequestsErrors;
  fetchFilterRequest: typeof fetchFilterRequest,
  previewFilterRequest: typeof previewFilterRequest,
  clearPreviewedFilter: typeof clearPreviewedFilter,
  updateFilterRequest: typeof updateFilterRequest,

  router: Object;
};
type State = {
  initialFilter: Object;
  filter: Object;
  updateRequestId: ?string;
};
class Edit extends React.PureComponent {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      initialFilter: props.initialFilter,
      filter: props.initialFilter,
      updateRequestId: null
    };
  }

  componentWillUnmount() {
    if (
      this.props.previewFilterRequestRunning ||
      this.props.previewFilterResponse || this.props.previewFilterLastError
    ) {
      this.props.clearPreviewedFilter();
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const {updateRequestId} = this.state;
    const updateResponse = updateRequestId &&
      nextProps.updateRequestsResponses[updateRequestId];
    if (updateResponse) {
      if (updateResponse.id != this.props.initialFilter.id) {
        this.props.router.push(`/mod/filters/${updateResponse.id}`);
      } else {
        this.props.fetchFilterRequest(updateResponse.id);
      }
      this.setState({updateRequestId: null});
    }

    if (
      this.props.initialFilter !== nextProps.initialFilter &&
      this.state.filter.mode === nextProps.initialFilter.mode &&
      _.isEqual(this.state.filter.action, nextProps.initialFilter.action) &&
      _.isEqual(this.state.filter.conditions, nextProps.initialFilter.conditions)
    ) {
      this.setState({
        filter: nextProps.initialFilter,
        initialFilter: nextProps.initialFilter
      });
    }
  }

  _getDirtyType(): 'clean'|'mode'|'all' {
    const {filter, initialFilter} = this.state;
    if (
      !_.isEqual(filter.action, initialFilter.action) ||
      !_.isEqual(filter.conditions, initialFilter.conditions)
    ) {
      return 'all';
    }
    if (filter.mode !== initialFilter.mode) {
      return 'mode';
    }
    return 'clean';
  }

  render() {
    const {
      isNewFilter,
      previewFilterRequestRunning,
      previewFilterResponse,
      previewFilterLastError,
      updateRequestsRunning,
      updateRequestsErrors,
    } = this.props;
    const {filter, updateRequestId} = this.state;
    const dirtyType = this._getDirtyType();

    const conditionRows = filter.conditions.map((condition, i) =>
      <ConditionRow
        key={i}
        isFirst={i === 0}
        isLast={i === filter.conditions.length-1}
        condition={condition}
        onRemove={() => {
          this.setState({
            filter: update(filter, {
              conditions: {
                $splice: [[i, 1]]
              }
            })
          });
        }}
        onMove={dir => {
          this.setState({
            filter: update(filter, {
              conditions: {
                $splice: [[i, 1], [dir === 'up' ? i-1 : i+1, 0, condition]]
              }
            })
          });
        }}
        onChange={condition => {
          this.setState({
            filter: update(filter, {
              conditions: {
                $splice: [[i, 1, condition]]
              }
            })
          });
        }}
        />
    );

    return (
      <div style={{marginBottom: '50px'}}>
        <div style={{visibility: dirtyType !== 'clean' ? 'visible' : 'hidden', color: 'red'}}>
          There are unsaved changes that will be lost if you leave this section.
        </div>
        <section>
          <h3>Conditions</h3>
          <table>
            <tbody>
              {conditionRows}
            </tbody>
          </table>
          <div>
            <button
              type="button"
              onClick={() => {
                this.setState({
                  filter: update(filter, {
                    conditions: {
                      $push: [{type: 'name', value: ''}]
                    }
                  })
                });
              }}
              >
              + Add condition
            </button>
          </div>
        </section>
        <section>
          <h3>Action</h3>
          <Action
            action={filter.action}
            onChange={action => {
              this.setState({
                filter: {...filter, action}
              });
            }}
            />
        </section>
        <section>
          <h3>Mode</h3>
          <div>
            <select value={filter.mode}
              onChange={event => {
                this.setState({
                  filter: {...filter, mode: +event.target.value}
                });
              }}
              >
              <option value="0">Disabled</option>
              <option value="1">Audit</option>
              <option value="2">Enforce</option>
            </select>
          </div>
        </section>
        <div style={{margin: '16px 0'}}>
          <button type="button"
            onClick={() => {
              this.props.previewFilterRequest(filter.conditions);
            }}
            >
            Preview Filter
          </button>
          <button type="button"
            disabled={
              (!this.props.isNewFilter && dirtyType==='clean') || (updateRequestId&&updateRequestsRunning.includes(updateRequestId))
            }
            onClick={this._onCreate}
            >
            {
              isNewFilter ? 'Create Filter' :
              dirtyType === 'mode' ? 'Update Filter' : 'Replace Filter'
            }
          </button>
        </div>
        <div>
          {previewFilterRequestRunning &&
            <div>
              Loading preview...
            </div>
          }
          <div style={{color: 'red'}}>
            <pre>
              {previewFilterLastError && JSON.stringify(previewFilterLastError,null,2)}
              {updateRequestId && updateRequestsErrors[updateRequestId] && JSON.stringify(updateRequestsErrors[updateRequestId],null,2)}
            </pre>
          </div>
          {previewFilterResponse &&
            <div>
              {previewFilterResponse.ignoredConditionTypes.length != 0 &&
                <div>
                  The following conditions are not applied by the preview:{' '}
                  {previewFilterResponse.ignoredConditionTypes.join(', ')}
                </div>
              }
              {previewFilterResponse.results.length == 0 ?
                <div>No matched posts.</div> :
                <ul>
                  {previewFilterResponse.results.map(result =>
                    <li key={`${result.board}_${result.id}`}>
                      <pre>
                        {JSON.stringify(result,null,2)}
                      </pre>
                    </li>
                  )}
                </ul>
              }
            </div>
          }
        </div>
      </div>
    );
  }

  _onCreate = () => {
    const {updateFilterRequest, initialFilter} = this.props;
    const {filter} = this.state;
    const dirtyType = this._getDirtyType();
    let updateRequestId = uuid.v4();
    if (dirtyType === 'mode') {
      updateFilterRequest(updateRequestId, {
        type: 'update',
        id: filter.id,
        mode: filter.mode
      });
    } else {
      updateFilterRequest(updateRequestId, {
        type: 'create',
        filter: {...filter, id: undefined, parent: initialFilter.id}
      });
    }
    this.setState({updateRequestId});
  };
}

function mapStateToProps(state) {
  const {
    previewFilterRequestRunning,
    previewFilterResponse,
    previewFilterLastError,

    updateRequestsRunning,
    updateRequestsResponses,
    updateRequestsErrors,
  } = state.modFilters;
  return {
    previewFilterRequestRunning,
    previewFilterResponse,
    previewFilterLastError,

    updateRequestsRunning,
    updateRequestsResponses,
    updateRequestsErrors,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchFilterRequest,
      previewFilterRequest,
      clearPreviewedFilter,
      updateFilterRequest,
    },
    dispatch
  );
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Edit));
