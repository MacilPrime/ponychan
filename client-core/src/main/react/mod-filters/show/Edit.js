/* @flow */

import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {previewFilterRequest, clearPreviewedFilter} from '../actions';

import update from 'react-addons-update';

import ConditionRow from './edit/ConditionRow';
import Action from './edit/Action';

type Props = {
  isNewFilter: boolean;
  initialFilter: Object;
  onCreate: (filter: Object) => void;

  previewFilterRequestRunning: boolean;
  previewFilterResponse: ?Object;
  previewFilterLastError: ?Object;
  previewFilterRequest(condtions: Object[]): void;
  clearPreviewedFilter(): void;
};
type State = {
  initialFilter: Object;
  filter: Object;
};
class Edit extends React.PureComponent {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      initialFilter: props.initialFilter,
      filter: props.initialFilter
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

  render() {
    const {
      isNewFilter,
      previewFilterRequestRunning,
      previewFilterResponse,
      previewFilterLastError,
    } = this.props;
    const {filter, initialFilter} = this.state;
    const dirty = !_.isEqual(filter, initialFilter);
    const onlyModeChanged = dirty && _.isEqual({...filter, mode: initialFilter.mode}, initialFilter);

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
        <div style={{visibility: dirty ? 'visible' : 'hidden', color: 'red'}}>
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
          <button type="button" disabled={!dirty} onClick={this._onCreate}>
            {
              isNewFilter ? 'Create Filter' :
              onlyModeChanged ? 'Update Filter' : 'Replace Filter'
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
    this.props.onCreate(this.state.filter);
  };
}

function mapStateToProps(state) {
  const {
    previewFilterRequestRunning,
    previewFilterResponse,
    previewFilterLastError
  } = state.modFilters;
  return {
    previewFilterRequestRunning,
    previewFilterResponse,
    previewFilterLastError
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({previewFilterRequest, clearPreviewedFilter}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Edit);
