import * as querystring from '@chaitin/querystring';
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';

/* @polymerMixin */
export const navigationMixin = superClass => class extends (superClass) {
	_navigate(path, queryStringCollection) {
		const pathWithQs = `${path}${this.__stringifyQueryStringCollection(queryStringCollection)}`;

		window.history.pushState({}, '', pathWithQs);
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
