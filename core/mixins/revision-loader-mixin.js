import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { ContentServiceApiClient, BrightspaceApiClient } from '@d2l/content-service-shared-utils';

import { parse } from '../../util/d2lrn.js';
import RenderErrors from '../../util/render-errors.js';

export const RevisionLoaderMixin = (superClass) => class extends superClass {
	static properties = {
		contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
		contentId: { type: String, attribute: 'content-id' },
		contextId: { type: String, attribute: 'context-id' },
		contextType: { type: String, attribute: 'context-type' },
		d2lrn: { type: String, attribute: 'd2lrn' },
		framed: { type: Boolean, value: false },
		revisionTag: { type: String, attribute: 'revision-tag' },
		tenantId: { type: String, attribute: 'tenant-id' },
		_contentId: { type: String, attribute: false },
		_revisionTag: { type: String, attribute: false },
		_tenantId: { type: String, attribute: false },
		_revision: { type: Object, attribute: false },
		_renderError: { type: String, attribute: false }
	};

	async updated(changedProperties) {
		super.updated(changedProperties);

		const reloadRevisionProperties = ['contentServiceEndpoint', 'contentId', 'contextId', 'contextType', 'd2lrn', 'revisionTag', 'tenantId'];
		if (reloadRevisionProperties.some(p => changedProperties.has(p))) {
			// either d2lrn or tenantId+contentId must be provided
			if (!this.d2lrn && !(this.tenantId && this.contentId)) {
				return;
			}

			if (!this.contentServiceEndpoint) {
				const brightspaceClient = new BrightspaceApiClient({
					httpClient: new ContentServiceBrowserHttpClient()
				});
				const {Endpoint} = await brightspaceClient.getContentServiceEndpoint();
				this.contentServiceEndpoint = Endpoint;
			}

			if (this.tenantId && this.contentId) {
				this._tenantId = this.tenantId;
				this._contentId = this.contentId;
				this._revisionTag = this.revisionTag || 'latest';
			} else {
				try {
					const { contentId, revisionId = 'latest', tenantId } = parse(this.d2lrn);
					this._contentId = contentId;
					this._revisionTag = revisionId;
					this._tenantId = tenantId;
				} catch (e) {
					this._renderError = RenderErrors.D2LRN_PARSE_ERROR;
					console.error('Failed to parse d2lrn - ', this.d2lrn);
					return;
				}
			}

			const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.contentServiceEndpoint, framed: this.framed });
			this._client = new ContentServiceApiClient({
				contextId: this.contextId,
				contextType: this.contextType,
				httpClient,
				tenantId: this._tenantId
			});

			this._loadRevision();
		}
	}

	async _getResource({resource, outputFormat = 'signed-url', query = {}}) {
		let result;
		try {
			result = await this._client.content.getResource({
				id: this._contentId,
				revisionTag: this._revisionTag,
				resource,
				outputFormat,
				query
			});
		} catch (error) {
			if (error.cause !== 404) {
				throw error;
			}
		}

		return result;
	}

	async _loadRevision() {
		let revision;
		let getRevisionFailed = false;
		try {
			revision = await this._client.content.getRevision({ id: this._contentId, revisionTag: this._revisionTag });
		} catch (e) {
			if (e.cause === 403) {
				this._renderError = RenderErrors.FORBIDDEN;
				return;
			} else if (e.cause === 404) {
				this._renderError = RenderErrors.REVISION_NOT_FOUND;
				return;
			} else if (/\bsandbox.*?\ballow-same-origin\b/i.test(e.message || '')) {
				this._renderError = RenderErrors.INSIDE_SANDBOX_ERROR;
				return;
			} else {
				console.error('Error loading revision', e);
				getRevisionFailed = true;
			}
		}

		if (getRevisionFailed || (revision && !revision.ready)) {
			setTimeout(this._loadRevision.bind(this), 10000);
		}

		if (!revision) {
			this._renderError = RenderErrors.UNKNOWN;
			return;
		}

		this._revision = revision;
	}
};
