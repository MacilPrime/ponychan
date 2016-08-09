/* @flow */

import React from 'react';

type ConditionValue = {type: string, value: any};
const STRING_TYPES = new Set(['name', 'trip', 'email', 'subject', 'body', 'filename', 'ip', 'board']);
const BOOLEAN_TYPES = new Set(['op', 'has_file', 'first_time_poster']);
const NUMBER_TYPES = new Set(['has_not_solved_captcha_in_x_minutes']);

export default class ConditionRow extends React.PureComponent {
  props: {
    condition: ConditionValue;
    onRemove(): void;
    onMove(direction: 'up'|'down'): void;
    onChange(value: ConditionValue): void;
  };

  _stringInput() {
    const {condition, onChange} = this.props;
    return (
      <input
        key="text"
        type="text"
        value={condition.value}
        onChange={event => onChange(({...condition, value: event.target.value}: any))}
        />
    );
  }

  _booleanInput() {
    const {condition, onChange} = this.props;
    return (
      <input
        key="checkbox"
        type="checkbox"
        checked={condition.value}
        onChange={event => onChange(({...condition, value: event.target.checked}: any))}
        />
    );
  }

  _numberInput() {
    const {condition, onChange} = this.props;
    return (
      <input
        key="number"
        type="number"
        value={condition.value}
        onChange={event => onChange(({...condition, value: +event.target.value}: any))}
        />
    );
  }

  render() {
    const {condition} = this.props;

    const input = STRING_TYPES.has(condition.type) ? this._stringInput() :
      BOOLEAN_TYPES.has(condition.type) ? this._booleanInput() :
      NUMBER_TYPES.has(condition.type) ? this._numberInput() : null;

    return (
      <tr>
        <td>
          <button type="button" onClick={()=>this.props.onRemove()}>[X]</button>
        </td>
        <td>
          <button type="button" onClick={()=>this.props.onMove('up')}>[up]</button>
        </td>
        <td>
          <button type="button" onClick={()=>this.props.onMove('down')}>[down]</button>
        </td>
        <td>
          <select value={condition.type}
            onChange={event => {
              this.props.onChange({
                type: event.target.value,
                value: STRING_TYPES.has(event.target.value) ? '' :
                  BOOLEAN_TYPES.has(event.target.value) ? false :
                  NUMBER_TYPES.has(event.target.value) ? 0 : null
              });
            }}
            >
            <option value="name">Name</option>
            <option value="trip">Tripcode</option>
            <option value="email">Email</option>
            <option value="subject">Subject</option>
            <option value="body">Body</option>
            <option value="filename">Filename</option>
            <option value="ip">IP</option>
            <option value="board">Board</option>
            <option value="op">OP</option>
            <option value="has_file">Has File</option>
            <option value="first_time_poster">First Time Poster</option>
            <option value="has_not_solved_captcha_in_x_minutes">Time since CAPTCHA</option>
          </select>
        </td>
        <td>
          {input}
        </td>
      </tr>
    );
  }
}
