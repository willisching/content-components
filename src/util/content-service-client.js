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

	_url(path, query) {
		const qs = query ? `?${querystring.stringify(query)}` : '';
		return `${this.endpoint}${path}${qs}`;
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

	searchContent({ start = 0, size = 20, sort, query = '', contentType = '' }) {
		const headers = new Headers();
		headers.append('pragma', 'no-cache');
		headers.append('cache-control', 'no-cache');

		return this._fetch({
			path: `/api/${this.tenantId}/search/content`,
			query: {
				start,
				size,
				sort,
				query,
				contentType
			},
			headers
		});
	}

	listContent({ ids = null } = {}) {
		return this._fetch({
			path: `/api/${this.tenantId}/content`,
			...ids && { queryParams: ids.join(',') }
		});
	}

	createContent(body) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/`,
			method: 'POST',
			body
		});
	}

	createRevision(contentId, body) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions`,
			method: 'POST',
			body
		});
	}

	deleteRevision({ contentId, revisionId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}`,
			method: 'DELETE'
		});
	}

	processRevision({
		contentId,
		revisionId
	}) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/process`,
			method: 'POST'
		});
	}

	getPreviewUrl({
		contentId,
		revisionId
	}) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/preview-url`
		});
	}

	getUploadContext({
		contentId,
		revisionId
	}) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/upload/context`
		});
	}

	getWorkflowProgress({
		contentId,
		revisionId
	}) {
		const headers = new Headers();
		headers.append('pragma', 'no-cache');
		headers.append('cache-control', 'no-cache');
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/progress`,
			headers
		});
	}

	signUploadRequest({
		fileName,
		contentType,
		contentDisposition
	}) {
		return this._fetch({
			path: '/api/s3/sign',
			query: {
				fileName,
				contentType,
				contentDisposition
			}
		});
	}

	getSignedUrlForRevision({
		contentId,
		revisionId
	}) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/signedUrl`
		});
	}

	getSupportedMimeTypes() {
		return this._fetch({ path: '/api/conf/supported-mime-types' });
	}

	getRevision({ contentId, revisionId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}`
		});
	}

	updateRevision({ contentId, revisionId, revision }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}`,
			method: 'PUT',
			body: revision
		});
	}
}
