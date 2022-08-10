import './src/d2l-media-capture-recorder';
import './src/d2l-media-capture-metadata';

import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin';
import { html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { S3Uploader } from '../../util/s3-uploader';

const VIEW = Object.freeze({
	RECORD: 'RECORD',
	PROGRESS: 'PROGRESS',
	METADATA: 'METADATA',
	LOADING: 'LOADING',
	ERROR: 'ERROR',
});

class D2LMediaCapture extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			tenantId: { type: String, attribute: 'tenant-id' },
			isAudio: { type: Boolean, attribute: 'is-audio' },
			canUpload: { type: Boolean, attribute: 'can-upload' },
			recordingDurationLimit: { type: Number, attribute: 'recording-duration-limit' },
			_currentView: { type: Number, attribute: false }
		};
	}

	constructor() {
		super();
		this.reset();
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = new ContentServiceApiClient({
			httpClient: new ContentServiceBrowserHttpClient({ serviceUrl: this.contentServiceEndpoint }),
			tenantId: this.tenantId
		});
		this._canRecord = typeof navigator.mediaDevices?.getUserMedia === 'function';
	}

	render() {
		const sourceSelector = html`
			<div>
			</div>
		`;
		let view;
		switch (this._currentView) {
			case VIEW.PROGRESS:
			case VIEW.LOADING:
				view = html`<d2l-loading-spinner></d2l-loading-spinner>`;
				break;
			case VIEW.RECORD:
				view = html`
					${sourceSelector}
					<d2l-media-capture-recorder
						?is-audio=${this.isAudio}
						recording-duration-limit=${this.recordingDurationLimit}
						@capture-clip-completed=${this._handleCaptureClipCompleted}
						@capture-cleared=${this._handleCaptureCleared}
					>
					</d2l-media-capture-recorder>
				`;
				break;
			case VIEW.UPLOAD:
				view = html`
					${sourceSelector}
					<d2l-media-capture-uploader>
					</d2l-media-capture-uploader>
				`;
				break;
			case VIEW.METADATA:
				view = html`
					<d2l-media-capture-metadata>
					</d2l-media-capture-metadata>
				`;
				break;
			case VIEW.ERROR:
				view = html`
					<div class="d2l-media-capture-error">
						${this.localize(this._error)}
					</div>
				`;
				break;
		}
		return view;
	}

	get fileSelected() {
		return !!this._mediaBlob;
	}

	get metadata() {
		return this.shadowRoot.querySelector('d2l-media-capture-metadata');
	}

	get metadataReady() {
		return this.metadata?.ready;
	}

	async processMediaObject() {
		const { title, description, autoCaptions, sourceLanguage } = this.metadata.values;
		try {
			await this.apiClient.content.updateItem({
				content: { id: this._contentId, title, description }
			});
			await this.apiClient.content.startWorkflow({
				id: this._contentId,
				revisionTag: this._revisionId,
				processOptions: { ...(autoCaptions && { captionLanguages: [sourceLanguage] }) }
			});
		} catch (error) {
			this._handleError(error);
		}
		this.dispatchEvent(new CustomEvent('processing-started', {
			bubbles: true,
			composed: true,
			detail: {
				contentId: this._contentId
			}
		}));
	}

	get recorder() {
		return this.shadowRoot.querySelector('d2l-media-capture-recorder');
	}

	reset() {
		this._currentView = VIEW.LOADING;
		this._error = null;
		this._mediaBlob = null;
		this._extension = null;
		this._contentId = null;
		this._revisionId = null;
	}

	showMetadataView() {
		if (this.fileSelected) {
			this._currentView = VIEW.METADATA;
		}
	}

	showRecordView() {
		this._currentView = VIEW.RECORD;
	}

	async uploadSelectedFile() {
		const contentType = this.isAudio ? 'Audio' : 'Video';
		this._currentView = VIEW.PROGRESS;
		try {
			this._contentId = (await this.apiClient.content.postItem({
				content: { type: contentType }
			})).id;
			const revision = await this.apiClient.content.createRevision({
				id: this._contentId,
				properties: {
					extension: this._extension
				}
			});
			this._revisionId = revision.id;
			const file = new File([this._mediaBlob], `temp.${this._extension}`);
			const s3Uploader = new S3Uploader({
				file,
				key: revision.s3Key,
				signRequest: ({ key }) =>
					this.apiClient.s3Sign.sign({
						fileName: key,
						contentType,
						contentDisposition: 'auto',
					})
			});
			await s3Uploader.upload();
			this._currentView = VIEW.METADATA;
			this.dispatchEvent(new CustomEvent('upload-success', {
				bubbles: true,
				composed: true,
				detail: {
					contentId: this._contentId
				}
			}));
		} catch (error) {
			this._handleError(error);
		}
	}

	_handleCaptureCleared() {
		this._mediaBlob = null;
	}

	_handleCaptureClipCompleted(e) {
		this._mediaBlob = e.detail.mediaBlob;
		this._extension = e.detail.extension;
	}

	_handleError(error) {
		this._currentView = VIEW.ERROR;
		if (error.cause === 503) {
			this._error = error;
		} else {
			this._error = 'workerErrorUploadFailed';
		}
	}
}

customElements.define('d2l-media-capture', D2LMediaCapture);
