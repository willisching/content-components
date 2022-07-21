import { css, html, LitElement } from 'lit-element/lit-element.js';
import { getDocumentLocaleSettings } from '@brightspace-ui/intl/lib/common.js';
import { ContentServiceApiClient } from '@d2l/content-service-api-client';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { parse } from '../../util/d2lrn.js';
import { createToolItemId, ToolItemType } from '../../util/tool-item-id.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';

class ContentScormPlayer extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			contextType: { type: String, attribute: 'context-type' },
			contextId: { type: String, attribute: 'context-id' },
			d2lrn: { type: String },
			framed: { type: Boolean, value: false },
			fullPageView: { type: Boolean, attribute: 'full-page-view' },
			preview: { type: Boolean },

			_url: { type: String, attribute: false },
		};
	}

	static get styles() {
		return css`
		.iframe-container {
			width: 100%;
			height: 100%;
		}
		iframe {
			width: 100%;
			height: 100vh;
			border: 0;
		}
		`;
	}

	render() {
		return html`
		<div class="iframe-container">
			<iframe
				src=${this._url}
				title=${this.localize('scormPlayer')}
			></iframe>
		</div>
		`;
	}

	updated(changedProperties) {
		if (changedProperties.has('d2lrn') || changedProperties.has('contentServiceEndpoint')) {
			this._setup();
		}
	}

	_parseContextId() {
		const splitContextId = this.contextId.split(':');
		return {
			topicId: splitContextId[0],
			orgUnitId: splitContextId[1]
		};
	}

	async _setup() {
		const { tenantId, contentId, revisionId = 'latest' } = parse(this.d2lrn);

		const httpClient = new ContentServiceBrowserHttpClient({
			serviceUrl: this.contentServiceEndpoint,
			framed: this.framed
		});
		this.client = new ContentServiceApiClient({
			httpClient,
			tenantId
		});

		let url;
		if (this.preview) {
			const result = await this.client.content.getPreviewUrl({id: contentId, revisionTag: revisionId});
			url = result.previewUrl;
		} else if (this.contextType === 'topic') {
			const locale = getDocumentLocaleSettings()._language || getDocumentLocaleSettings()._fallbackLanguage;
			const { topicId, orgUnitId } = this._parseContextId();
			const result = await this.client.topic.launch({
				id: createToolItemId({ toolItemType: ToolItemType.Topic, id: topicId}),
				locale,
				contentId,
				revisionTag: revisionId,
				orgUnitId
			});
			url = result.url;
		} else {
			throw new Error('Invalid inputs');
		}

		if (this.fullPageView) {
			window.location.replace(url);
		} else {
			this._url = url;
		}
	}

}

customElements.define('d2l-content-scorm-player', ContentScormPlayer);
