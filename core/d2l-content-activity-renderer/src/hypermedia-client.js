import SirenParse from 'siren-parser';
import * as querystring from '@chaitin/querystring';
import fetchAuthUnframed from 'd2l-fetch-auth/src/unframed/index.js';
import fetchAuthFramed from 'd2l-fetch-auth/es6/d2lfetch-auth-framed.js';
import { d2lfetch } from 'd2l-fetch/src/index.js';

export default class HypermediaClient {
	constructor({ entity, framed }) {
		this.entity = SirenParse(entity);
		this.framed = framed;
		this.d2lfetch = d2lfetch.addTemp({
			name: 'auth',
			fn: this.framed ? fetchAuthFramed : fetchAuthUnframed
		});
	}

	async getResourceEntity() {
		if (!this.entity.hasLinkByClass('content-service-resource')) {
			return null;
		}

		const { href } = this.entity.getLinkByClass('content-service-resource');
		try {
			const resourceResponse = await this._fetch({ url: href });
			const resourceEntity = SirenParse(resourceResponse);
			return resourceEntity;
		} catch (e) {
			if (e.code === 404) {
				return null;
			}
			throw e;
		}
	}

	async _fetch({
		url,
		method = 'GET',
		query,
		body,
		extractJsonBody = true,
		headers = new Headers(),
		doNotUseCache = true
	}) {

		if (body) {
			headers.append('Content-Type', 'application/json');
		}

		if (doNotUseCache) {
			headers.append('pragma', 'no-cache');
			headers.append('cache-control', 'no-cache');
		}

		const requestInit = {
			method,
			...body && {
				body: JSON.stringify(body)
			},
			headers
		};
		const request = new Request(this._url(url, query), requestInit);
		const response = await this.d2lfetch.fetch(request);
		if (!response.ok) {
			const err = new Error(response.statusText);
			err.code = response.status;
			throw err;
		}

		if (extractJsonBody) {
			return response.json();
		}

		return response;
	}

	_url(url, query) {
		const qs = query ? `?${querystring.stringify(query)}` : '';
		return `${url}${qs}`;
	}
}
