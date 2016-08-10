/* @flow */

import _ from 'lodash';
import React from 'react';
import update from 'react-addons-update';

import ConditionRow from './edit/ConditionRow';
import Action from './edit/Action';

type Props = {
  initialFilter: Object;
  onCreate: (filter: Object) => void;
};
type State = {
  initialFilter: Object;
  filter: Object;
};
export default class Edit extends React.PureComponent {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      initialFilter: props.initialFilter,
      filter: props.initialFilter
    };
  }

  render() {
    const {filter, initialFilter} = this.state;
    const newFilter = false;
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
      <div>
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
          <button type="button">
            Preview Filter
          </button>
          <button type="button" disabled={!dirty} onClick={this._onCreate}>
            {
              newFilter ? 'Create Filter' :
              onlyModeChanged ? 'Update Filter' : 'Replace Filter'
            }
          </button>
        </div>
      </div>
    );
  }

  _onCreate = () => {
    this.props.onCreate(this.state.filter);
  };
}
