import {
	UPDATE_PAGE
} from '../actions/app.js';

const INITIAL_STATE = {
	page: ''
};

// See: https://redux.js.org/recipes/structuring-reducers/initializing-state/
// eslint-disable-next-line default-param-last
const app = (state = INITIAL_STATE, action) => {
	switch (action.type) {
		case UPDATE_PAGE:
			return {
				...state,
				page: action.page,
				queryParams: action.queryParams
			};
		default:
			return state;
	}
};

export default app;
