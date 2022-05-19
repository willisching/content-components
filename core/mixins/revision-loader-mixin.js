import ContentServiceBrowserHttpClient from 'd2l-content-service-browser-http-client';
import { ContentServiceApiClient, BrightspaceApiClient } from 'd2l-content-service-api-client';

import { parse } from '../../util/d2lrn.js';

export const RevisionLoaderMixin = (superClass) => class extends superClass {
	static properties = {
		contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
		contextId: { type: String, attribute: 'context-id' },
		contextType: { type: String, attribute: 'context-type' },
		d2lrn: { type: String, attribute: 'd2lrn' },
		_contentId: { type: String, attribute: false },
		_revisionId: { type: String, attribute: false },
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
		this._revisionId = null;
		this._tenantId = null;
	}

	async updated(changedProperties) {
		super.updated(changedProperties);

		const reloadRevisionProperties = ['d2lrn', 'contentServiceEndpoint', 'contextId', 'contextType'];
		if (reloadRevisionProperties.some(p => changedProperties.has(p))) {
			if (!this.d2lrn) {
				return;
			}

			if (this.d2lrn && !this.contentServiceEndpoint) {
				const brightspaceClient = new BrightspaceApiClient({
					httpClient: new ContentServiceBrowserHttpClient()
				});
				const {Endpoint} = await brightspaceClient.getContentServiceEndpoint();
				this.contentServiceEndpoint = Endpoint;
			}

			try {
				const { contentId, revisionId = 'latest', tenantId } = parse(this.d2lrn);
				this._contentId = contentId;
				this._revisionId = revisionId;
				this._tenantId = tenantId;
			} catch (e) {
				this._d2lParseError = true;
				console.error('Failed to parse d2lrn - ', this.d2lrn);
				return;
			}

			this._loadRevision();
		}
	}

	async _loadRevision() {
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.contentServiceEndpoint });
		const client = new ContentServiceApiClient({
			contextId: this.contextId,
			contextType: this.contextType,
			httpClient,
			tenantId: this._tenantId
		});

		let revision;
		let getRevisionFailed = false;
		try {
			revision = await client.content.getRevision({ id: this._contentId, revisionTag: this._revisionId });
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
