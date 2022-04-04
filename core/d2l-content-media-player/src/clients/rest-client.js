import * as querystring from '@chaitin/querystring';
import auth from 'd2l-fetch-auth/src/unframed/index.js';
import { d2lfetch } from 'd2l-fetch/src/index.js';
import { ContentType, VideoFormat } from './enums.js';

export default class ContentServiceClient {
	constructor({
		contentId,
		contextId,
		contextType,
		endpoint,
		revisionId,
		tenantId,
	}) {
		this.contentId = contentId;
		this.contextId = contextId;
		this.contextType = contextType;
		this.d2lfetch = d2lfetch.addTemp({ name: 'auth', fn: auth });
		this.endpoint = endpoint;
		this.revisionId = revisionId;
		this.tenantId = tenantId;
	}

	get dump() {
		return `Content Service Client: ${this.endpoint}`;
	}

	getCaptions() {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${this.contentId}/revisions/${this.revisionId}/captions`,
		});
	}

	async getDownloadUrl({format, attachment}) {
		const result = await this._fetch({
			path: `/api/${this.tenantId}/content/${this.contentId}/revisions/${this.revisionId}/signed-url`,
			query: {
				format: format ? format.value : undefined,
				attachment,
			}
		});
		return {
			expires: result.expireTime * 1000,
			src: result.value,
			format,
		};
	}

	getMetadata() {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${this.contentId}/revisions/${this.revisionId}/resources/metadata/file-content`
		});
	}

	async getPoster() {
		const content = await this._fetch({
			path: `/api/${this.tenantId}/content/${this.contentId}`,
			query: {
				includeUrl: true
			}
		});
		return content.thumbnailUrl;
	}

	async getRevision() {
		const revision = await this._fetch({
			path: `/api/${this.tenantId}/content/${this.contentId}/revisions/${this.revisionId}`,
			query: {
				includeTitle: true,
				includeDescription: true
			}
		});
		return revision ? this._formatRevision(revision) : null;
	}

	getThumbnails() {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${this.contentId}/revisions/${this.revisionId}/resources/thumbnails/signed-url`
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

		if (method === 'GET') {
			headers.append('pragma', 'no-cache');
			headers.append('cache-control', 'no-cache');
			query = {
				contextId: this.contextId,
				contextType: this.contextType,
				...query
			};
		}

		const requestInit = {
			method,
			...body && {
				body: contentType === 'application/json' ? JSON.stringify(body) : body
			},
			headers
		};
		const request = new Request(this._url(path, query), requestInit);

		const response = await this.d2lfetch.fetch(request);
		if (!response.ok) {
			throw new Error(response.statusText, { cause: response.status });
		}

		if (extractJsonBody) {
			return response.json();
		}

		return response;
	}

	_formatRevision(revision) {
		revision.type = ContentType.get(revision.type);
		revision.formats = revision.formats.map(format => VideoFormat.get(format.toUpperCase()).key.toLowerCase());
		return revision;
	}

	_url(path, query) {
		const qs = query ? `?${querystring.stringify(query)}` : '';
		return `${this.endpoint}${path}${qs}`;
	}
}
