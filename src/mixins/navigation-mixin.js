import * as querystring from '@chaitin/querystring';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { navigate } from '../actions/app.js';
import { store } from '../store.js';

/* @polymerMixin */
export const navigationMixin = superClass => class extends connect(store)(superClass) {
	_navigate(path, queryStringCollection) {
		const pathWithQs = `${path}${this.__stringifyQueryStringCollection(queryStringCollection)}`;

		window.history.pushState({}, '', pathWithQs);
		store.dispatch(
			navigate(pathWithQs));
	}

	__stringifyQueryStringCollection(queryStringCollection) {
		let qs = '';
		if (queryStringCollection) {
			qs = `?${querystring.stringify(queryStringCollection)}`;
		}
		return qs;
	}
};

export const NavigationMixin = dedupingMixin(navigationMixin);
