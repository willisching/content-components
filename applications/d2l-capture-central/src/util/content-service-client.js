import * as querystring from '@chaitin/querystring';
import auth from 'd2l-fetch-auth/src/unframed/index.js';
import { contentFilterToSearchQuery } from './content-type.js';
import { d2lfetch } from 'd2l-fetch/src/index.js';
import { dateFilterToSearchQuery } from './date-filter.js';

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

	createContent(body) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/`,
			method: 'POST',
			body
		});
	}

	createRevision({ contentId, body, sourceRevisionId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions`,
			method: 'POST',
			body,
			query: { sourceRevisionId }
		});
	}

	deleteContent({ contentId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}`,
			method: 'DELETE',
			extractJsonBody: false
		});
	}

	deleteMetadata({ contentId, revisionId, draft = false }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/metadata`,
			method: 'DELETE',
			query: { draft }
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

	getContent(id) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${id}`
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

	getRevision({ contentId, revisionId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}`
		});
	}

	getSignedUrl(contentId) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/signedUrl`
		});
	}

	getSignedUrlForRevision({ contentId, revisionId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/signedUrl`
		});
	}

	getSupportedMimeTypes() {
		return this._fetch({ path: '/api/conf/supported-mime-types' });
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

	listContent({ ids = null } = {}) {
		return this._fetch({
			path: `/api/${this.tenantId}/content`,
			...ids && { queryParams: ids.join(',') }
		});
	}

	processRevision({
		contentId,
		revisionId,
		body,
	}) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/process`,
			method: 'POST',
			body,
		});
	}

	searchContent({
		start = 0,
		size = 15,
		sort = 'updatedAt:desc',
		query = '',
		contentType = '',
		updatedAt = '',
		createdAt = '',
		includeThumbnails = false
	}) {
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
				contentType: contentFilterToSearchQuery(contentType),
				updatedAt: dateFilterToSearchQuery(updatedAt),
				createdAt: dateFilterToSearchQuery(createdAt),
				includeThumbnails
			},
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

	undeleteContent({ contentId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}`,
			method: 'PUT',
			body: { id: contentId, deletedAt: null }
		});
	}

	updateContent({id, body}) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${id}`,
			method: 'PUT',
			body
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

	_url(path, query) {
		const qs = query ? `?${querystring.stringify(query)}` : '';
		return `${this.endpoint}${path}${qs}`;
	}
}
