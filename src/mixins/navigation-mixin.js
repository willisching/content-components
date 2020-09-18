import * as querystring from '@chaitin/querystring';
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import page from 'page/page.mjs';
import { rootStore } from '../state/root-store.js';

/* @polymerMixin */
export const navigationMixin = superClass => class extends (superClass) {
	_navigate(path, queryStringCollection) {
		const pathWithQs = `/${rootStore.routingStore.orgUnitId}${path}${this.__stringifyQueryStringCollection(queryStringCollection)}`;
		page(pathWithQs);
		window.scrollTo(0, 0);
	}

	_goTo(route, queryParams) {
		return () => this._navigate(route, queryParams);
	}

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
};

export const NavigationMixin = dedupingMixin(navigationMixin);
