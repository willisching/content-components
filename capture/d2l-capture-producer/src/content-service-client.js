import * as querystring from '@chaitin/querystring';
import auth from 'd2l-fetch-auth/src/unframed/index.js';
import { d2lfetch } from 'd2l-fetch/src/index.js';

d2lfetch.use({ name: 'auth', fn: auth });

export default class ContentServiceClient {
	constructor({
		endpoint,
		tenantId,
		onUploadProgress
	}) {
		this.endpoint = endpoint;
		this.tenantId = tenantId;
		this.onUploadProgress = onUploadProgress;
	}

	createRevision({ contentId, body, draftFromSource }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions`,
			method: 'POST',
			body,
			query: { draftFromSource }
		});
	}

	deleteCaptions({ contentId, revisionId, locale, adjusted = false }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/resources/captions`,
			method: 'DELETE',
			query: { locale, adjusted },
		});
	}

	deleteMetadata({ contentId, revisionId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/resources/metadata`,
			method: 'DELETE',
		});
	}

	deleteRevision({ contentId, revisionId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}`,
			method: 'DELETE'
		});
	}

	get dump() {
		return `Content Service Client: ${this.endpoint}`;
	}

	async getCaptionsUrl({ contentId, revisionId, locale, adjusted = false }) {
		const headers = new Headers();
		headers.append('pragma', 'no-cache');
		headers.append('cache-control', 'no-cache');
		return await this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/resources/captions/signed-url`,
			query: { locale, exact: true, adjusted },
			headers
		});
	}

	getContent(id) {
		const headers = new Headers();
		headers.append('pragma', 'no-cache');
		headers.append('cache-control', 'no-cache');
		return this._fetch({
			path: `/api/${this.tenantId}/content/${id}`,
			headers,
		});
	}

	getMetadata({ contentId, revisionId }) {
		const headers = new Headers();
		headers.append('pragma', 'no-cache');
		headers.append('cache-control', 'no-cache');
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/resources/metadata/file-content`,
			headers
		});
	}

	getOriginalSignedUrlForRevision({ contentId, revisionId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/resources/original/signed-url`
		});
	}

	getRevision({ contentId, revisionId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}`
		});
	}

	getRevisionProgress({ contentId, revisionId }) {
		const headers = new Headers();
		headers.append('pragma', 'no-cache');
		headers.append('cache-control', 'no-cache');
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/progress`,
			headers
		});
	}

	processRevision({
		contentId,
		revisionId,
		captionLanguages,
	}) {
		const body = captionLanguages ? { captionLanguages } : undefined;
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/process`,
			method: 'POST',
			body,
		});
	}

	updateCaptions({ contentId, revisionId, locale, captionsVttText, adjusted = false }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/resources/captions`,
			method: 'PUT',
			query: { locale, adjusted },
			body: captionsVttText,
			contentType: 'text/vtt',
			extractJsonBody: false // The PUT captions route returns no content (status 204)
		});
	}

	updateContent({id, body}) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${id}`,
			method: 'PUT',
			body
		});
	}

	updateMetadata({ contentId, revisionId, metadata }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/resources/metadata`,
			method: 'PUT',
			body: metadata,
			extractJsonBody: false // The PUT metadata route returns no content (status 204)
		});
	}

	updateRevision({ contentId, revisionId, revision }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}`,
			method: 'PUT',
			body: revision
		});
	}

	async _fetch({
		path,
		method = 'GET',
		query,
		body,
		contentType = 'application/json',
		extractJsonBody = true,
		headers = new Headers()
	}) {
		if (body && contentType) {
			headers.append('Content-Type', contentType);
		}

		const requestInit = {
			method,
			...body && {
				body: contentType === 'application/json' ? JSON.stringify(body) : body
			},
			headers
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
