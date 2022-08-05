import './src/d2l-recorder';

import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin';
import { html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin';
import { Uploader } from '../../util/uploader';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';

const VIEW = Object.freeze({
	RECORD: 'RECORD',
	PROGRESS: 'PROGRESS',
	METADATA: 'METADATA',
	LOADING: 'LOADING',
});

class Recorder extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			tenantId: { type: String, attribute: 'tenant-id' },
			recordingDurationLimit: { type: Number, attribute: 'recording-duration-limit' },
			_currentView: { type: Number, attribute: false }
		};
	}

	constructor() {
		super();
		this._currentView = VIEW.LOADING;
	}

	connectedCallback() {
		super.connectedCallback();
		this._currentView = VIEW.RECORD;
		this.apiClient = new ContentServiceApiClient({
			httpClient: new ContentServiceBrowserHttpClient({ serviceUrl: this.contentServiceEndpoint }),
			tenantId: this.tenantId
		});

		this.uploader = new Uploader({
			apiClient: this.apiClient
		});
	}

	render() {
		let view;
		switch (this._currentView) {
			case VIEW.PROGRESS:
			case VIEW.LOADING:
				view = html`<d2l-loading-spinner></d2l-loading-spinner>`;
				break;
			case VIEW.RECORD:
				view = html`
					<d2l-recorder
						recording-duration-limit=${this.recordingDurationLimit}
					>
					</d2l-recorder>
				`;
				break;
			case VIEW.METADATA:
				view = html`
					<div>
						<p>This is the metadata view</p>
					</div>
				`;
		}
		return view;
	}

	get fileSelected() {
		return !!this.recorder._mediaBlob;
	}

	get recorder() {
		return this.shadowRoot.querySelector('d2l-recorder');
	}

	uploadSelectedFile() {
		this.recorder.mediaPreview.pause();
		this._currentView = VIEW.PROGRESS;
		this.uploader.uploadFile(this.recorder._mediaBlob, 'test', '', 1);
	}
}

customElements.define('d2l-capture-recorder', Recorder);
