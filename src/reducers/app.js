import {
	LOAD_CONFIG,
	UPDATE_PAGE
} from '../actions/app.js';
import appConfig from '../app-config.js';

const INITIAL_STATE = {
	page: ''
};

// See: https://redux.js.org/recipes/structuring-reducers/initializing-state/
// eslint-disable-next-line default-param-last
const app = (state = INITIAL_STATE, { type, ...action }) => {
	switch (type) {
		case LOAD_CONFIG:
			return {
				...state,
				...appConfig.fromObject(action)
			};
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
