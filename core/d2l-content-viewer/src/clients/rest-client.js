import * as querystring from '@chaitin/querystring';
import fetchAuthUnframed from 'd2l-fetch-auth/src/unframed/index.js';
import { d2lfetch } from 'd2l-fetch/src/index.js';
import { ContentType, VideoFormat } from './enums.js';

export default class ContentServiceClient {
	constructor({
		topicId,
		orgUnitId,
	}) {
		this.topicId = topicId;
		this.orgUnitId = orgUnitId;
		this.d2lfetch = d2lfetch.addTemp({
			name: 'auth',
			fn: fetchAuthUnframed
		});
	}

	getCaptions(captionsHref) {
		return this._fetch({
			path: captionsHref || `/d2l/le/content/contentservice/resources/${this.orgUnitId}/topics/${this.topicId}/getCaptions`
		});
	}

	getDownloadUrl({format, href}) {
		return this._fetch({
			path: href || `/d2l/le/content/contentservice/resources/${this.orgUnitId}/topics/${this.topicId}/download`,
			query: {
				format: format ? format.value : undefined
			},
			doNotUseCache: false
		});
	}

	getMetadata() {
		return this._fetch({
			path: `/d2l/le/content/contentservice/resources/${this.orgUnitId}/topics/${this.topicId}/metadata`
		});
	}

	async getRevision() {
		return this._formatRevision(await this._fetch({
			path: `/d2l/le/content/contentservice/resources/${this.orgUnitId}/topics/${this.topicId}/revision`
		}));
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

	_formatRevision(revision) {
		revision.Type = ContentType.get(revision.Type);
		revision.Formats = revision.Formats.map(format => VideoFormat.get(format));
		return revision;
	}

	_url(path, query) {
		const qs = query ? `?${querystring.stringify(query)}` : '';
		return `${path}${qs}`;
	}
}
