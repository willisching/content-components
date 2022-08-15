import './src/d2l-media-capture-recorder';
import './src/d2l-media-capture-uploader';
import './src/d2l-media-capture-metadata';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { S3Uploader } from '../../util/s3-uploader';
import { getExtension } from '../../util/media-type-util';

const VIEW = Object.freeze({
	RECORD_OR_UPLOAD: 'RECORD_OR_UPLOAD',
	PROGRESS: 'PROGRESS',
	METADATA: 'METADATA',
	ERROR: 'ERROR',
});

class D2LMediaCapture extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			tenantId: { type: String, attribute: 'tenant-id' },
			isVideoNote: { type: Boolean, attribute: 'is-video-note' },
			isAudio: { type: Boolean, attribute: 'is-audio' },
			canCapture: { type: Boolean, attribute: 'can-capture' },
			canUpload: { type: Boolean, attribute: 'can-upload' },
			autoCaptionsEnabled: { type: Boolean, attribute: 'auto-captions-enabled' },
			maxFileSizeInBytes: { type: Number, attribute: 'max-file-size' },
			recordingDurationLimit: { type: Number, attribute: 'recording-duration-limit' },
			_currentView: { type: Number, attribute: false },
			_sourceSelectorLocked: { type: Boolean, attribute: false },
			_isRecording: { type: Boolean, attribute: false }
		};
	}

	static get styles() {
		return css`
			.d2l-media-capture-loading-container {
				align-items: center;
				display: flex;
				flex-direction: column;
				justify-content: center;
				padding-top: 100px;
				width: 100%;
			}

			.d2l-media-source-selector-container {
				margin-bottom: 15px;
			}

			.d2l-media-source-selector-container:after {
				content: ".";
				display: block;
				clear: both;
				visibility: hidden;
				line-height: 0;
				height: 0;
			}

			.d2l-media-capture-source-selector {
				display: inline-block;
				margin-top: 0;
				border: 1px solid #494c4e;
				color: black;
				float: left;
				padding: 5px;
				margin-right: 2px;
				text-decoration: none;
			}
			
			.d2l-media-capture-source-selector:hover {
				cursor: pointer;
			}

			.d2l-media-capture-source-selector-active {
				font-weight: bold;
			}

			.d2l-media-capture-source-selector-inactive {
				background-color: #EEEEEE;
				color: #333;
			}

			.d2l-media-capture-source-selector-active-locked {
				color: #999999;	
			}
			
			.d2l-media-capture-source-selector-inactive-locked {
				color: #cccccc;	
				background-color: #EEEEEE;
			}

			.d2l-media-capture-source-selector-active-locked:hover,
			.d2l-media-capture-source-selector-inactive-locked:hover {
				cursor: default;
			}

			.d2l-media-capture-aria-log {
				left: -999em;
				position: absolute;
				width: 1em;
			}
		`;
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
		this._canRecord = this.canCapture && typeof navigator.mediaDevices?.getUserMedia === 'function';
		this._isRecording = this._canRecord;
	}

	render() {
		let view;
		switch (this._currentView) {
			case VIEW.PROGRESS:
				view = html`
					${this._renderSourceSelector()}
					<div class="d2l-media-capture-loading-container">
						<d2l-loading-spinner size="150"></d2l-loading-spinner>
						<div>${this.localize('pleaseWait')}</div>
					</div>
				`;
				break;
			case VIEW.RECORD_OR_UPLOAD:
				view = html`
					${this._renderSourceSelector()}
					${this._isRecording ? html`
						<d2l-media-capture-recorder
							?is-audio=${this.isAudio}
							?can-capture=${this.canCapture}
							recording-duration-limit=${this.isAudio ? this.recordingDurationLimit / 60 : this.recordingDurationLimit}
							@capture-started=${this._handleCaptureStarted}
							@capture-clip-completed=${this._handleCaptureClipCompleted}
						>
						</d2l-media-capture-recorder>` : html`
						<d2l-media-capture-uploader
							?is-audio=${this.isAudio}
							max-file-size=${this.maxFileSizeInBytes}
							@file-selected=${this._handleFileSelected}
						>
						</d2l-media-capture-uploader>
					`}
				`;
				break;
			case VIEW.METADATA:
				view = html`
					<d2l-media-capture-metadata
						?is-audio=${this.isAudio}
						?is-video-note=${this.isVideoNote}
						?auto-captions-enabled=${this.autoCaptionsEnabled}
					>
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

		return html`
			${view}
			<div
				id="media-capture-aria-log"
				class="d2l-media-capture-aria-log"
				role="log"
				aria-live="assertive"
			></div>
		`;
	}

	get fileSelected() {
		return !!this._file;
	}

	get metadataReady() {
		return this.shadowRoot?.querySelector('d2l-media-capture-metadata')?.ready;
	}

	async processMediaObject() {
		const {
			title,
			description,
			autoCaptions,
			sourceLanguage
		} = this.shadowRoot.querySelector('d2l-media-capture-metadata').values;
		try {
			await this.apiClient.content.updateItem({
				content: {
					id: this._contentId,
					...(title.length && { title }),
					...(description.length && { description })
				}
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

	reset() {
		this._currentView = VIEW.PROGRESS;
		this._error = null;
		this._file = null;
		this._contentId = null;
		this._revisionId = null;
		this._sourceSelectorLocked = false;
	}

	showMetadataView() {
		if (this.fileSelected) {
			this._currentView = VIEW.METADATA;
		}
	}

	showRecordOrUploadView() {
		this._currentView = VIEW.RECORD_OR_UPLOAD;
	}

	async uploadSelectedFile() {
		if (!this._file) {
			this._currentView = VIEW.ERROR;
			this._error = 'mediaCaptureUploadErrorTryAgain';
			return;
		}
		const contentType = this.isAudio ? 'Audio' : 'Video';
		this._currentView = VIEW.PROGRESS;
		try {
			this._contentId = (await this.apiClient.content.postItem({
				content: { type: contentType }
			})).id;
			const revision = await this.apiClient.content.createRevision({
				id: this._contentId,
				properties: {
					extension: getExtension(this._file.name)
				}
			});
			this._revisionId = revision.id;
			const s3Uploader = new S3Uploader({
				file: this._file,
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
			this._updateAriaLog('uploadComplete');
		} catch (error) {
			this._handleError(error);
		}
	}

	_handleCaptureClipCompleted(event) {
		this._file = new File(
			[event.detail.mediaBlob],
			`temp.${event.detail.extension}`
		);
		this._updateAriaLog('recordingStopped');
	}

	_handleCaptureStarted() {
		this._file = null;
		this._sourceSelectorLocked = true;
		this._updateAriaLog('captureCleared');
	}

	_handleError(error) {
		this._currentView = VIEW.ERROR;
		if (error.cause === 503) {
			this._error = 'workerErrorAVCapsExceeded';
		} else {
			this._error = 'mediaCaptureUploadErrorTryAgain';
		}
	}

	_handleFileSelected(event) {
		this._file = event.detail.file;
		this._sourceSelectorLocked = true;
	}

	_handleSourceSelectorClick(isRecording) {
		return () => {
			if (!this._sourceSelectorLocked) {
				this._isRecording = isRecording;
			}
		};
	}

	_renderSourceSelector() {
		if (!(this._canRecord && this.canUpload)) {
			this._sourceSelectorLocked = true;
			return;
		}
		let sourceSelectorRecordStatus = this._isRecording ? 'active' : 'inactive';
		let sourceSelectorUploadStatus = !this._isRecording ? 'active' : 'inactive';
		if (this._sourceSelectorLocked) {
			sourceSelectorRecordStatus += '-locked';
			sourceSelectorUploadStatus += '-locked';
		}

		return html`
			<div class="d2l-media-source-selector-container">
				<a
					id="source-selector-record"
					title="${this.localize(this.isAudio ? 'recordAudio' : 'recordWebcamVideo')}"
					class="d2l-media-capture-source-selector d2l-media-capture-source-selector-${sourceSelectorRecordStatus}"
					@click=${this._handleSourceSelectorClick(true)}
					tabindex=0
				>
					${this.localize(this.isAudio ? 'recordAudio' : 'recordWebcamVideo')}
				</a>
				<a
					id="source-selector-upload"
					title="${this.localize('uploadFile')}"
					class="d2l-media-capture-source-selector d2l-media-capture-source-selector-${sourceSelectorUploadStatus}"
					@click=${this._handleSourceSelectorClick(false)}
					tabindex=0
				>
					${this.localize('uploadFile')}
				</a>
			</div>
		`;
	}

	_updateAriaLog(status) {
		this.shadowRoot.querySelector('#media-capture-aria-log').textContent = this.localize(status);
	}
}

customElements.define('d2l-media-capture', D2LMediaCapture);
