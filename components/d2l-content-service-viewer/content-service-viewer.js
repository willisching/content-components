import '@brightspace-ui-labs/media-player/media-player.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';

import ContentServiceClient from './clients/content-service-client.js';

class ContentServiceViewer extends LitElement {
	static get properties() {
		return {
			endpoint: { type: String, attribute: 'endpoint' },
			tenant: { type: String, attribute: 'tenant' },
			resource: { type: String, attribute: 'resource' },
			context: { type: String, attribute: 'context' },
		};
	}

	static get styles() {
		return css`
			:host {
				display: inline-block;
				width: 100%;
			}
			:host([hidden]) {
				display: none;
			}
		`;
	}

	firstUpdated() {
		super.firstUpdated();
		this.client = new ContentServiceClient({
			endpoint: this.endpoint,
			tenant: this.tenant
		});
		this.loadContent();
	}

	render() {
		// <track src="sample.vtt" kind="subtitles" srclang="en" label="L1 (vtt)">
		// <track src="sample-2.vtt" kind="subtitles" srclang="fr" label="L2 (vtt)">
		// <track src="sample.srt" kind="subtitles" srclang="sp" label="L3 (srt)">
		// <track src="sample-2.srt" kind="captions" srclang="ch" label="L4 (srt)">

		return this._signedUrl && html`
			<d2l-labs-media-player src="${this._signedUrl}"></d2l-labs-media-player>
		`;
	}

	async loadContent() {
		const response = await this.client.getDownloadUrl({
			resource: this.resource,
			context: this.context,
		});
		this._expires = response.expireTime;
		this._signedUrl = response.value;
		this.requestUpdate();
	}
}
customElements.define('d2l-content-service-viewer', ContentServiceViewer);
