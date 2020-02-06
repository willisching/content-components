import { html } from 'lit-element/lit-element.js';
import * as querystring from '@chaitin/querystring';
import { d2lfetch } from 'd2l-fetch/src/index.js';
import auth from 'd2l-fetch-auth/src/unframed/index.js';

d2lfetch.use({ name: 'auth', fn: auth });

export default class ContentServiceClient {
	constructor(endpoint) {
		this.endpoint = endpoint;
	}

	async _fetch({ path, method = 'GET', queryParams, bodyParams, extractJsonBody = true }) {
		const qs = queryParams ? `?${querystring.stringify(queryParams)}` : '';
		const request = new Request(`${this.endpoint}${path}${qs}`, {
			method,
			...bodyParams && { body: JSON.stringify(bodyParams) }
		});

		const response = await d2lfetch.fetch(request);
		if (extractJsonBody) {
			try {
				return await response.json();
			} catch (error) {
				return { error: true };
			}
		}

		return response;
	}

	get dump() {
		return html`<p>Content Service Client: ${this.endpoint}</p>`;
	}
}
