import * as querystring from '@chaitin/querystring';
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import page from 'page/page.mjs';
import { rootStore } from '../state/root-store.js';

/* @polymerMixin */
export const navigationMixin = superClass => class extends (superClass) {
	__stringifyQueryStringCollection(queryStringCollection) {
		let qs = '';
		if (queryStringCollection) {
			const { searchQuery } = queryStringCollection;
			const encodedSearchQueryStringCollection = {
				...queryStringCollection,
				...searchQuery && { searchQuery: encodeURIComponent(searchQuery) }
			};
			qs = `?${querystring.stringify(encodedSearchQueryStringCollection)}`;
		}

		return qs;
	}

	_goTo(route, queryParams) {
		return () => this._navigate(route, queryParams);
	}

	_navigate(path, queryStringCollection) {
		rootStore.routingStore.setPreviousPage();
		if (!queryStringCollection) queryStringCollection = {};
		queryStringCollection['ou'] = rootStore.routingStore.orgUnitId;
		const pathWithQs = `${path}${this.__stringifyQueryStringCollection(queryStringCollection)}`;
		page(pathWithQs);
		window.scrollTo(0, 0);
	}
};

export const NavigationMixin = dedupingMixin(navigationMixin);
