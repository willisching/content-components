import {
	applyMiddleware,
	combineReducers,
	compose,
	createStore
} from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import thunk from 'redux-thunk';
import app from './reducers/app.js';

const devCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const store = createStore(
	state => state,
	devCompose(
		lazyReducerEnhancer(combineReducers),
		applyMiddleware(thunk))
);

store.addReducers({
	app
});
