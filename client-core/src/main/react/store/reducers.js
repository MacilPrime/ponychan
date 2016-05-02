import {combineReducers} from 'redux';
import {routerReducer as routing} from 'react-router-redux';

const initialState = {
  i: 0
};

function foo(state=initialState, action={}) {
  switch (action.type) {
  case 'INC':
    return {i: state.i+1};
  default:
    return state;
  }
}

export default combineReducers({
  routing,
  foo
});
