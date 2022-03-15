import * as querystring from '@chaitin/querystring';
import fetchAuthUnframed from 'd2l-fetch-auth/src/unframed/index.js';
import { d2lfetch } from 'd2l-fetch/src/index.js';

export default class ContentServiceClient {
	constructor({
		topicId,
	}) {
		this.topicId = topicId;
		this.d2lfetch = d2lfetch.addTemp({
			name: 'auth',
			fn: fetchAuthUnframed
		});
	}

	getD2LRN() {
		return this._fetch({
			path: `/d2l/le/content/contentservice/resources/topics/${this.topicId}/d2lrn`
		});
	}

	async _fetch({
		path,
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
			headers,
		};
		const request = new Request(this._url(path, query), requestInit);

		const response = await this.d2lfetch.fetch(request);
		if (!response.ok) {
			throw new Error(response.statusText);
		}

		if (extractJsonBody) {
			return response.json();
		}

		return response;
	}

	_url(path, query) {
		const qs = query ? `?${querystring.stringify(query)}` : '';
		return `${path}${qs}`;
	}
}
