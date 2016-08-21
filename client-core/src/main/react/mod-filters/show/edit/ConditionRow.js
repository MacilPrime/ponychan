/* @flow */

import React from 'react';

type ConditionValue = {type: string, value: any};

const filterTypes: {[type:string]: {valueType: string, defaultValue: any}} = {
  'name': {valueType: 'string', defaultValue: ''},
  'trip': {valueType: 'string', defaultValue: ''},
  'email': {valueType: 'string', defaultValue: ''},
  'subject': {valueType: 'string', defaultValue: ''},
  'body': {valueType: 'string', defaultValue: ''},
  'filename': {valueType: 'string', defaultValue: ''},
  'ip': {valueType: 'string', defaultValue: ''},
  'board': {valueType: 'string', defaultValue: ''},

  'op': {valueType: 'boolean', defaultValue: true},
  'has_file': {valueType: 'boolean', defaultValue: true},
  'first_time_poster': {valueType: 'boolean', defaultValue: true},

  'has_not_solved_captcha_in_x_minutes': {valueType: 'number', defaultValue: 1440},
};

export default class ConditionRow extends React.PureComponent {
  props: {
    isFirst: ?boolean;
    isLast: ?boolean;
    condition: ConditionValue;
    onRemove(): void;
    onMove(direction: 'up'|'down'): void;
    onChange(condition: ConditionValue): void;
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
    const {isFirst, isLast, condition} = this.props;

    let input;
    switch (filterTypes[condition.type].valueType) {
    case 'string':
      input = this._stringInput();
      break;
    case 'boolean':
      input = this._booleanInput();
      break;
    case 'number':
      input = this._numberInput();
      break;
    }

    return (
      <tr>
        <td>
          <button type="button" onClick={()=>this.props.onRemove()}>[X]</button>
        </td>
        <td>
          <button
            style={{visibility: isFirst ? 'hidden' : 'visible'}}
            type="button" onClick={()=>this.props.onMove('up')}>[up]</button>
        </td>
        <td>
          <button
            style={{visibility: isLast ? 'hidden' : 'visible'}}
            type="button" onClick={()=>this.props.onMove('down')}>[down]</button>
        </td>
        <td>
          <select value={condition.type}
            onChange={event => {
              this.props.onChange({
                type: event.target.value,
                value: filterTypes[event.target.value].defaultValue
              });
            }}
            >
            <option value="name">Name</option>
            <option value="trip">Tripcode</option>
            <option value="email">Email</option>
            <option value="subject">Subject</option>
            <option value="body">Body</option>
            <option value="filename">Filename</option>
            <option value="ip" disabled={true}>IP</option>
            <option value="board">Board</option>
            <option value="op">OP</option>
            <option value="has_file">Has File</option>
            <option value="first_time_poster">First Time Poster</option>
            <option value="has_not_solved_captcha_in_x_minutes">Minutes since CAPTCHA</option>
          </select>
        </td>
        <td>
          {input}
        </td>
      </tr>
    );
  }
}
