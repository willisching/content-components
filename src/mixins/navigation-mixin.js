import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { navigate } from '../actions/app.js';
import { store } from '../store.js';

/* @polymerMixin */
export const navigationMixin = superClass => class extends connect(store)(superClass) {
	_navigate(path, queryStringCollection) {

		console.log('>> pushing to history with path:', path);
		window.history.pushState({}, '', path);
		store.dispatch(
			navigate(`${path}`));
	}
};

export const NavigationMixin = dedupingMixin(navigationMixin);
