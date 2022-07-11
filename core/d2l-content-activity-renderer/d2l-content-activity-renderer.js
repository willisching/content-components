import '../d2l-content-renderer.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';

import HypermediaClient from './src/hypermedia-client.js';

class ContentActivityRenderer extends LitElement {

	static get properties() {
		return {
			_contentServiceEndpoint: { type: String, attribute: false },
			_d2lrn: { type: String, attribute: false },
			_topicId: { type: String, attribute: false },
			activity: { type: String },
			allowDownload: { type: Boolean, attribute: 'allow-download'},
			allowDownloadOnError: { type: Boolean, attribute: 'allow-download-on-error' },
			fullPageView: { type: Boolean, attribute: 'full-page-view' },
			framed: { type: Boolean, value: false }
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

	constructor() {
		super();
		this._d2lrn = '';
		this._contentServiceEndpoint = '';
		this._topicId = '';
	}

	async firstUpdated() {
		super.firstUpdated();
		this.hmClient = new HypermediaClient({
			entity: this.activity,
			framed: this.framed
		});
		this.resourceEntity = await this.hmClient.getResourceEntity();
		if (this.resourceEntity) {
			this._d2lrn = this.resourceEntity.properties.d2lrn;
			this._contentServiceEndpoint = this.resourceEntity.properties.contentServiceEndpoint;
			this._topicId = this.resourceEntity.properties.topicId;
		}
	}

	render() {
		return html`
			<d2l-content-renderer
				id="renderer"
				?allow-download=${this.allowDownload}
				?allow-download-on-error=${this.allowDownloadOnError}
				content-service-endpoint=${this._contentServiceEndpoint}
				context-id=${this._topicId}
				context-type='topic'
				d2lrn=${this._d2lrn}
				?framed=${this.framed}
				?full-page-view=${this.fullPageView}
			></d2l-content-renderer>
		`;
	}

}
customElements.define('d2l-content-activity-renderer', ContentActivityRenderer);
