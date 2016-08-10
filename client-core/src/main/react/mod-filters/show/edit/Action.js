/* @flow */

import React from 'react';

export default class Action extends React.PureComponent {
  props: {
    action: Object;
    onChange(action: Object): void;
  };

  render() {
    const {action, onChange} = this.props;

    const typePicker = (
      <div>
        <select value={action.type}
          onChange={event => {
            const type = event.target.value;
            switch (type) {
            case 'reject':
              onChange({
                type: 'reject', message: null
              });
              break;
            case 'ban':
              onChange({
                type: 'ban',
                reason: '',
                length: 0,
                single_board: false,
                ban_type: 0
              });
              break;
            case 'captcha':
              onChange({
                type: 'captcha'
              });
              break;
            }
          }}
          >
          <option value="reject">Reject</option>
          <option value="ban">Ban</option>
          <option value="captcha">CAPTCHA</option>
        </select>
      </div>
    );

    let configureArea;
    switch (action.type) {
    case 'reject':
      configureArea = (
        <div>
          <table className="banForm">
            <tbody>
              <tr>
                <th>Message</th>
                <td>
                  <textarea
                    cols={30}
                    placeholder="(Empty gives a generic post rejection message)"
                    value={action.message || ''}
                    onChange={event => {
                      // should use null instead of empty string here
                      onChange({
                        ...action, message: event.target.value.trim() || null
                      });
                    }}
                    />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
      break;
    case 'ban':
      configureArea = (
        <div>
          <table className="banForm">
            <tbody>
              <tr>
                <th>Reason</th>
                <td>
                  <textarea rows={5} cols={30} value={action.reason}
                    onChange={event => {
                      onChange({...action, reason: event.target.value});
                    }}
                    />
                </td>
              </tr>
              <tr>
                <th>Length (seconds)</th>
                <td>
                  <input type="number"
                    value={action.length || 0}
                    onChange={event => {
                      onChange({...action, length: +event.target.value});
                    }}
                    />
                </td>
              </tr>
              <tr>
                <th>Board</th>
                <td>
                  <label>
                    <input type="checkbox"
                      checked={!action.single_board}
                      onChange={event => {
                        onChange({...action, single_board: !event.target.checked});
                      }}
                      /> All boards
                  </label>
                </td>
              </tr>
              <tr>
                <th>Type</th>
                <td>
                  <ul style={{padding:'0 5px', listStyle: 'none'}}>
                    <li>
                      <label>
                        <input type="radio"
                          checked={!action.ban_type}
                          onChange={() => {
                            onChange({...action, ban_type: 0});
                          }}
                          /> Full ban
                      </label>
                    </li>
                    <li>
                      <label>
                        <input type="radio"
                          checked={action.ban_type === 1}
                          onChange={() => {
                            onChange({...action, ban_type: 1});
                          }}
                          /> Image ban
                      </label>
                    </li>
                    <li>
                      <label>
                        <input type="radio"
                          checked={action.ban_type === 2}
                          onChange={() => {
                            onChange({...action, ban_type: 2});
                          }}
                          /> Thread starting ban
                      </label>
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
      break;
    case 'captcha':
      break;
    }

    return (
      <div>
        {typePicker}
        {configureArea}
      </div>
    );
  }
}
