import '../d2l-content-renderer.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';

import ContentServiceClient from './src/rest-client.js';

class ContentTopicRenderer extends LitElement {
	static get properties() {
		return {
			_d2lrn: { type: String, attribute: false },
			allowDownload: { type: Boolean, attribute: 'allow-download' },
			allowDownloadOnError: { type: Boolean, attribute: 'allow-download-on-error' },
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			topicId: { type: Number, attribute: 'topic-id' },
		};
	}
	static get styles() {
		return css`
			:host {
				display: inline-block;
			}
			:host([hidden]) {
				display: none;
			}
		`;
	}

	async firstUpdated() {
		super.firstUpdated();
		this.client = new ContentServiceClient({
			topicId: this.topicId,
		});
		this._d2lrn = await this.client.getD2LRN();
	}

	render() {
		return html`
			<d2l-content-renderer
				?allow-download=${this.allowDownload}
				?allow-download-on-error=${this.allowDownloadOnError}
				content-service-endpoint=${this.contentServiceEndpoint}
				context-id=${this.topicId}
				context-type='topic'
				d2lrn=${this._d2lrn}
			></d2l-content-renderer>
		`;
	}

}
customElements.define('d2l-content-topic-renderer', ContentTopicRenderer);
