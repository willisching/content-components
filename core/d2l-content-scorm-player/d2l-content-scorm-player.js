import { css, html, LitElement } from 'lit-element/lit-element.js';
import { parse } from '../../util/d2lrn.js';
import { ContentServiceApiClient } from 'd2l-content-service-api-client';
import ContentServiceBrowserHttpClient from 'd2l-content-service-browser-http-client';

class ContentScormPlayer extends LitElement {
	static get properties() {
		return {
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			d2lrn: { type: String },
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
			></iframe>
		</div>
		`;
	}

	updated(changedProperties) {
		if (changedProperties.has('d2lrn') || changedProperties.has('contentServiceEndpoint')) {
			this._setup();
		}
	}

	async _setup() {
		const { contentId, revisionId = 'latest', tenantId } = parse(this.d2lrn);
		const httpClient = new ContentServiceBrowserHttpClient({
			serviceUrl: this.contentServiceEndpoint
		});
		this.client = new ContentServiceApiClient({
			httpClient,
			tenantId,
		});

		const previewUrl = await this.client.content.getPreviewUrl({id: contentId, revisionTag: revisionId});
		this._url = previewUrl.previewUrl;
	}

}

customElements.define('d2l-content-scorm-player', ContentScormPlayer);
