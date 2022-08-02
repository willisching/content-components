import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { ContentServiceApiClient, BrightspaceApiClient } from '@d2l/content-service-shared-utils';

import { parse } from '../../util/d2lrn.js';

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
		_d2lrnParseError: { type: Boolean, attribute: false },
		_noRevisionFound: { type: Boolean, attribute: false },
		_revision: { type: Object, attribute: false }
	};

	constructor() {
		super();

		this._contentId = null;
		this._d2lrnParseError = false;
		this._noRevisionFound = false;
		this._revision = null;
		this._revisionTag = null;
		this._tenantId = null;
	}

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
					this._d2lParseError = true;
					console.error('Failed to parse d2lrn - ', this.d2lrn);
					return;
				}
			}

			this._loadRevision();
		}
	}

	async _loadRevision() {
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.contentServiceEndpoint, framed: this.framed });
		const client = new ContentServiceApiClient({
			contextId: this.contextId,
			contextType: this.contextType,
			httpClient,
			tenantId: this._tenantId
		});

		let revision;
		let getRevisionFailed = false;
		try {
			revision = await client.content.getRevision({ id: this._contentId, revisionTag: this._revisionTag });
		} catch (e) {
			getRevisionFailed = true;
		}

		if (getRevisionFailed || (revision && !revision.ready)) {
			setTimeout(this._loadRevision.bind(this), 10000);
		}

		if (!revision) {
			this._noRevisionFound = true;
			return;
		}

		this._revision = revision;
	}
};
