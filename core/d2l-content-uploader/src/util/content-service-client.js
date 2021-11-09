import * as querystring from '@chaitin/querystring';
import auth from 'd2l-fetch-auth/src/unframed/index.js';
import { d2lfetch } from 'd2l-fetch/src/index.js';
import { parse } from './d2lrn';

d2lfetch.use({ name: 'auth', fn: auth });

export default class ContentServiceClient {
	constructor({
		endpoint,
		tenantId,
		orgUnitId
	}) {
		this.endpoint = endpoint;
		this.tenantId = tenantId;
		this.orgUnitId = orgUnitId;
	}

	createContent(body) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/`,
			method: 'POST',
			body: {
				...body,
				clientApp: 'LmsContent',
			},
			appendOrgUnitIdQuery: true,
		});
	}

	createRevision(contentId, body) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions`,
			method: 'POST',
			body,
			appendOrgUnitIdQuery: true,
		});
	}

	deleteContent(contentId) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}`,
			method: 'DELETE',
			extractJsonBody: false
		});
	}

	getRevisionByName(d2lrn) {
		const { tenantId, contentId, revisionId } = parse(d2lrn);
		return this._fetch({
			path: `/api/${tenantId}/content/${contentId}/revisions/${revisionId}`,
		});
	}

	getSecureUrlByName(d2lrn, format) {
		const { tenantId, contentId, revisionId } = parse(d2lrn);
		return this._fetch({
			path: `/api/${tenantId}/content/${contentId}/revisions/${revisionId}/signed-url`,
			query: { format },
			appendOrgUnitIdQuery: true,
		});
	}

	getSupportedMimeTypes() {
		return this._fetch({ path: '/api/conf/supported-mime-types' });
	}

	getWorkflowProgress({
		contentId,
		revisionId
	}) {
		const headers = new Headers();

		/* The global d2l-fetch instance defined by BSI injects d2l-fetch-simple-cache as a middleware.
		 * This middleware causes the browser to return cached responses for 2 minutes, regardless of whether
		 * the origin server (e.g. Content Service) sets 'cache-control: must-revalidate, max-age=0'  in the response.
		 *
		 * We don't want this behaviour when polling the progress endpoint, as it results in stale progress data.
		 *
		 * According to d2l-fetch-simple-cache's documentation, this behaviour can be disabled by including a
		 * 'cache-control: no-cache' header in the request.
		 */
		headers.append('cache-control', 'no-cache');

		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/progress`,
			headers,
			appendOrgUnitIdQuery: true,
		});
	}

	processRevision({
		contentId,
		revisionId,
		captionLanguages,
	}) {
		return this._fetch({
			path: `/api/${this.tenantId}/content/${contentId}/revisions/${revisionId}/process`,
			method: 'POST',
			...(captionLanguages && { body: { captionLanguages } }),
			appendOrgUnitIdQuery: true,
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
				contentDisposition,
			},
			appendOrgUnitIdQuery: true,
		});
	}

	async _fetch({
		path,
		method = 'GET',
		query,
		body,
		extractJsonBody = true,
		headers = new Headers(),
		appendOrgUnitIdQuery = false,
	}) {
		if (body) {
			headers.append('Content-Type', 'application/json');
		}

		let queryToUse = query;
		if (appendOrgUnitIdQuery) {
			queryToUse = {...query, ...this.orgUnitId && {checkAccessToOrgUnitId: this.orgUnitId}};
		}

		const requestInit = {
			method,
			...body && {
				body: JSON.stringify(body)
			},
			headers
		};
		const request = new Request(this._url(path, queryToUse), requestInit);

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
