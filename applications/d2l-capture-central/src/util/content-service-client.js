import * as querystring from '@chaitin/querystring';
import auth from 'd2l-fetch-auth/src/unframed/index.js';
import { contentFilterToSearchQuery } from './content-type.js';
import { d2lfetch } from 'd2l-fetch/src/index.js';
import { dateFilterToSearchQuery } from './date-filter.js';
import { getTimeZoneOrTimeZoneOffset } from './date-time.js';

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
		this.timeZone = getTimeZoneOrTimeZoneOffset();
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

	deleteContent({ contentId, hardDelete = false }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}`,
			method: 'DELETE',
			body: {hardDelete: hardDelete},
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

	async getCaptionsUrl({ contentId, revisionId, locale }) {
		return await this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/resources/captions/signed-url`,
			query: { locale }
		});
	}

	getContent(id) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${id}`
		});
	}

	async getLatestRevision(id) {
		const content = await this.getContent(id);
		const reversedCopyOfRevisions = content.revisions.slice().reverse();
		return reversedCopyOfRevisions.find(revision => !revision.draft);
	}
	getMetadata({ contentId, revisionId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/resources/metadata/file-content`
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

	getSignedUrl({ contentId, attachment = false }) {
		const query = {};
		if (attachment) query.attachment = true;
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/signedUrl`,
			query
		});
	}

	getSignedUrlForRevision({ contentId, revisionId, attachment = false }) {
		const query = {};
		if (attachment) query.attachment = true;
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/signedUrl`,
			query
		});
	}

	getSignedUrls({ contentId, revisionId }) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/resources/transcodes/signed-urls`
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
		clientApps = 'all',
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
				clientApps,
				updatedAt: dateFilterToSearchQuery(updatedAt),
				createdAt: dateFilterToSearchQuery(createdAt),
				timeZone: this.timeZone,
				includeThumbnails
			},
			headers
		});
	}

	searchDeletedContent({
		start = 0,
		size = 15,
		sort = 'updatedAt:desc',
		query = '',
		contentType = '',
		clientApps = 'all',
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
				clientApps,
				updatedAt: dateFilterToSearchQuery(updatedAt),
				createdAt: dateFilterToSearchQuery(createdAt),
				timeZone: this.timeZone,
				filter: 'DELETED',
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
