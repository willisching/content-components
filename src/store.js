import {
	applyMiddleware,
	combineReducers,
	compose,
	createStore
} from 'redux';

import app from './reducers/app.js';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import thunk from 'redux-thunk';

const devCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
window.process = { env: { NODE_ENV: 'production' } };
export const store = createStore(
	state => state,
	devCompose(
		lazyReducerEnhancer(combineReducers),
		applyMiddleware(thunk))
);

store.addReducers({
	app
});
