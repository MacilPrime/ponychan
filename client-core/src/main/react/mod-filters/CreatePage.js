/* @flow */

import React from 'react';
import {Link} from 'react-router';
import Title from '../common/Title';
import Edit from './show/Edit';

export default class CreatePage extends React.PureComponent {
  render() {
    return (
      <Title title="Create Filter">
        <div>
          <div>
            <Link to="/mod/filters/">Back to Filters Dashboard</Link>
          </div>
          <Edit
            isNewFilter={true}
            initialFilter={{
              mode: 1,
              conditions: [
                {type: 'name', value: '/^Spammy McSpamface$/i'}
              ],
              action: {
                type: 'reject',
                message: null
              }
            }}
            />
        </div>
      </Title>
    );
  }
}
