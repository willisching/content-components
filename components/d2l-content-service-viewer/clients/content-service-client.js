import * as querystring from '@chaitin/querystring';
import auth from 'd2l-fetch-auth/src/unframed/index.js';
import { d2lfetch } from 'd2l-fetch/src/index.js';

d2lfetch.use({ name: 'auth', fn: auth });

export default class ContentServiceClient {
	constructor({
		endpoint,
		tenant,
	}) {
		this.endpoint = endpoint;
		this.tenant = tenant;
	}

	getDownloadUrl({ resource, context }) {
		return this._fetch({
			path: `/api/resources/download?resource=${resource}&context=${context}`
		});
	}

	async _fetch({
		path,
		method = 'GET',
		query,
		body,
		extractJsonBody = true,
		headers = new Headers()
	}) {
		if (body) {
			headers.append('Content-Type', 'application/json');
		}

		const requestInit = {
			method,
			...body && {
				body: JSON.stringify(body)
			},
			headers,
			credentials: 'include',
		};
		const request = new Request(this._url(path, query), requestInit);

		const response = await d2lfetch.fetch(request);
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
		return `${this.endpoint}${path}${qs}`;
	}
}
