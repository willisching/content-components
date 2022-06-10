import '../d2l-content-renderer.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { BrightspaceApiClient } from 'd2l-content-service-api-client';
import ContentServiceBrowserHttpClient from 'd2l-content-service-browser-http-client';

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
			#renderer {
				width: 100%;
			}
		`;
	}

	async firstUpdated() {
		super.firstUpdated();
		const client = new BrightspaceApiClient({
			httpClient: new ContentServiceBrowserHttpClient()
		});
		this._d2lrn = await client.getD2lRn({ topicId: this.topicId });
	}

	render() {
		return html`
			<d2l-content-renderer
				id="renderer"
				?allow-download=${this.allowDownload}
				?allow-download-on-error=${this.allowDownloadOnError}
				content-service-endpoint=${ifDefined(this.contentServiceEndpoint)}
				context-id=${this.topicId}
				context-type='topic'
				d2lrn=${this._d2lrn}
			></d2l-content-renderer>
		`;
	}

	reloadResources(reloadRevision = true) {
		this.renderer.reloadResources(reloadRevision);
	}

	get renderer() {
		return this.renderRoot.querySelector('#renderer');
	}

}
customElements.define('d2l-content-topic-renderer', ContentTopicRenderer);
