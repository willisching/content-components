import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import './src/d2l-media-web-recording-recorder';
import './src/d2l-media-web-recording-uploader';
import './src/d2l-media-web-recording-metadata';

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
const AUDIO = 'Audio';

class D2LMediaWebRecording extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			tenantId: { type: String, attribute: 'tenant-id' },
			clientApp: { type: String, attribute: 'client-app' },
			canCaptureAudio: { type: Boolean, attribute: 'can-capture-audio' },
			canCaptureVideo: { type: Boolean, attribute: 'can-capture-video' },
			canUpload: { type: Boolean, attribute: 'can-upload' },
			autoCaptionsEnabled: { type: Boolean, attribute: 'auto-captions-enabled' },
			maxFileSizeInBytes: { type: Number, attribute: 'max-file-size' },
			audioRecordingDurationLimit: { type: Number, attribute: 'audio-recording-duration-limit' },
			videoRecordingDurationLimit: { type: Number, attribute: 'video-recording-duration-limit' },
			isMediaPlatform: { type: Boolean, attribute: 'is-media-platform' },
			_currentView: { type: Number, attribute: false },
			_sourceSelectorLocked: { type: Boolean, attribute: false },
			_isRecording: { type: Boolean, attribute: false }
		};
	}

	static get styles() {
		return css`
			.d2l-media-web-recording-loading-container {
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

			.d2l-media-web-recording-source-selector {
				margin-top: 0;
				border: 1px solid #494c4e;
				color: black;
				float: left;
				padding: 5px;
				margin-right: 2px;
				text-decoration: none;
			}

			.d2l-media-web-recording-source-selector:hover {
				cursor: pointer;
			}

			.d2l-media-web-recording-source-selector-active {
				font-weight: bold;
			}

			.d2l-media-web-recording-source-selector-inactive {
				background-color: #EEEEEE;
				color: #333;
			}

			.d2l-media-web-recording-source-selector-active-locked {
				color: #999999;
			}

			.d2l-media-web-recording-source-selector-inactive-locked {
				color: #cccccc;
				background-color: #EEEEEE;
			}

			.d2l-media-web-recording-source-selector-active-locked:hover,
			.d2l-media-web-recording-source-selector-inactive-locked:hover {
				cursor: default;
			}

			.d2l-media-web-recording-aria-log {
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
		this._canRecord = (this.canCaptureVideo || this.canCaptureAudio) && typeof navigator.mediaDevices?.getUserMedia === 'function';
		this._isRecording = this._canRecord;
	}

	render() {
		let view;
		let recordOrUploadView;
		switch (this._currentView) {
			case VIEW.PROGRESS:
				view = html`
					${this._renderSourceSelector()}
					<div class="d2l-media-web-recording-loading-container">
						<d2l-loading-spinner size="150"></d2l-loading-spinner>
						<div>${this.localize('pleaseWait')}</div>
					</div>
				`;
				break;
			case VIEW.RECORD_OR_UPLOAD:
				if (this._isRecording) {
					recordOrUploadView = html`
						<d2l-media-web-recording-recorder
							?can-capture-audio=${this._canRecord && this.canCaptureAudio}
							?can-capture-video=${this._canRecord && this.canCaptureVideo}
							?is-media-platform=${this.isMediaPlatform}
							audio-recording-duration-limit=${this.audioRecordingDurationLimit}
							video-recording-duration-limit=${this.videoRecordingDurationLimit}
							@capture-started=${this._handleCaptureStarted}
							@capture-clip-completed=${this._handleCaptureClipCompleted}
						>
						</d2l-media-web-recording-recorder>
					`;
				} else if (this.canUpload) {
					recordOrUploadView = html`
						<d2l-media-web-recording-uploader
							?can-upload-audio=${this.canCaptureAudio}
							?can-upload-video=${this.canCaptureVideo}
							max-file-size=${this.maxFileSizeInBytes}
							@file-selected=${this._handleFileSelected}
							@file-selection-error=${this._handleFileSelectionError}
						>
						</d2l-media-web-recording-uploader>
					`;
				}
				view = html`
					${this._renderSourceSelector()}
					${recordOrUploadView}
				`;
				break;
			case VIEW.METADATA:
				view = html`
					<d2l-media-web-recording-metadata
						?is-audio=${this._contentType === AUDIO}
						?is-media-platform=${this.isMediaPlatform}
						?auto-captions-enabled=${this.autoCaptionsEnabled}
					>
					</d2l-media-web-recording-metadata>
				`;
				break;
			case VIEW.ERROR:
				view = html`
					<div class="d2l-media-web-recording-error">
						${this.localize(this._error)}
					</div>
				`;
				break;
		}

		return html`
			${view}
			<div
				id="media-web-recording-aria-log"
				class="d2l-media-web-recording-aria-log"
				role="log"
				aria-live="assertive"
			></div>
		`;
	}

	get fileSelected() {
		return !!this._file;
	}

	get metadataReady() {
		return this.shadowRoot?.querySelector('d2l-media-web-recording-metadata')?.ready;
	}

	async processMediaObject() {
		const {
			title,
			description,
			autoCaptions,
			sourceLanguage
		} = this.shadowRoot.querySelector('d2l-media-web-recording-metadata').values;
		const dispatchProcessingStarted = () => {
			this.dispatchEvent(new CustomEvent('processing-started', {
				bubbles: true,
				composed: true,
				detail: {
					contentId: this._contentId,
					revisionId: this._revisionId,
					contentType: this._contentType === AUDIO ? 'audio' : 'video'
				}
			}));
		};
		try {
			if (this.isMediaPlatform) {
				const callback = (rpcResponse) => {
					if (rpcResponse.GetResponseType() === D2L.Rpc.ResponseType.Success) {
						dispatchProcessingStarted();
					} else {
						this._handleError(rpcResponse.result);
					}
				};
				D2L.Rpc.Create('AddMediaObject', callback, this._rpcAddress).Call(
					`${this._contentId}:${this._revisionId}`,
					title,
					description,
					this._contentType === AUDIO,
					sourceLanguage,
					!!autoCaptions
				);
			} else {
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
				dispatchProcessingStarted();
			}
		} catch (error) {
			this._handleError(error);
		}
	}

	reset() {
		this._currentView = VIEW.PROGRESS;
		this._error = null;
		this._file = null;
		this._contentId = null;
		this._revisionId = null;
		this._sourceSelectorLocked = false;
		this._maxRetryAttempts = 1;
		this._rpcAddress = '/d2l/wcs/mp/platform.d2l';
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
		this._currentView = VIEW.PROGRESS;

		const onUploadSuccess = () => {
			this._currentView = VIEW.METADATA;
			this.dispatchEvent(new CustomEvent('upload-success', {
				bubbles: true,
				composed: true,
				detail: {
					contentId: this._contentId
				}
			}));
			this._updateAriaLog('uploadComplete');
		};

		try {
			if (this.isMediaPlatform) {
				this._uploadVideoNote(1, onUploadSuccess);
			} else {
				this._contentId = (await this.apiClient.content.postItem({
					content: { type: this._contentType, clientApp: this.clientApp }
				})).id;
				const revision = await this.apiClient.content.createRevision({
					id: this._contentId,
					properties: {
						extension: getExtension(this._file.name),
						...(this._contentType !== AUDIO && { formats: ['sd'] })
					}
				});
				this._revisionId = revision.id;
				const s3Uploader = new S3Uploader({
					file: this._file,
					key: revision.s3Key,
					signRequest: ({ key }) =>
						this.apiClient.s3Sign.sign({
							fileName: key,
							contentType: this._contentType,
							contentDisposition: 'auto',
						})
				});
				await s3Uploader.upload();
				onUploadSuccess();
			}
		} catch (error) {
			this._handleError(error);
		}
	}

	_handleCaptureClipCompleted(event) {
		this._file = new File(
			[event.detail.mediaBlob],
			`temp.${event.detail.extension}`
		);
		this._contentType = event.detail.contentType;
		this._updateAriaLog('recordingStopped');
	}

	_handleCaptureStarted() {
		this._file = null;
		this._sourceSelectorLocked = true;
		this._updateAriaLog('captureCleared');
	}

	_handleError(error) {
		this._currentView = VIEW.ERROR;
		if (error && (error.cause === 503 || error.DataCapsExceeded)) {
			this._error = 'workerErrorAVCapsExceeded';
		} else {
			this._error = 'mediaCaptureUploadErrorTryAgain';
		}
	}

	_handleFileSelected(event) {
		this._file = event.detail.file;
		this._contentType = event.detail.contentType;
		this._sourceSelectorLocked = true;
	}

	_handleFileSelectionError() {
		this._file = null;
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
			return;
		}
		let sourceSelectorRecordStatus = this._isRecording ? 'active' : 'inactive';
		let sourceSelectorUploadStatus = !this._isRecording ? 'active' : 'inactive';
		if (this._sourceSelectorLocked) {
			sourceSelectorRecordStatus += '-locked';
			sourceSelectorUploadStatus += '-locked';
		}
		const recordLangterm = this.canCaptureAudio ? (this.canCaptureVideo ? 'record' : 'recordAudio') : 'recordWebcamVideo';

		return html`
			<div class="d2l-media-source-selector-container">
				<a
					id="source-selector-record"
					title="${this.localize(recordLangterm)}"
					class="d2l-media-web-recording-source-selector d2l-media-web-recording-source-selector-${sourceSelectorRecordStatus}"
					@click=${this._handleSourceSelectorClick(true)}
					href="javascript://"
					tabindex=0
				>
					${this.localize(recordLangterm)}
				</a>
				<a
					id="source-selector-upload"
					title="${this.localize('uploadFile')}"
					class="d2l-media-web-recording-source-selector d2l-media-web-recording-source-selector-${sourceSelectorUploadStatus}"
					@click=${this._handleSourceSelectorClick(false)}
					href="javascript://"
					tabindex=0
				>
					${this.localize('uploadFile')}
				</a>
			</div>
		`;
	}

	_updateAriaLog(status) {
		this.shadowRoot.getElementById('media-web-recording-aria-log').textContent = this.localize(status);
	}

	_uploadVideoNote(retryAttempt, onUploadSuccess) {
		const callback = (rpcResponse) => {
			const result = rpcResponse.GetResult();
			if (rpcResponse.GetResponseType() === D2L.Rpc.ResponseType.Success) {
				[this._contentId, this._revisionId] = result.ContentRevision.split(':');
				const formData = new FormData();
				formData.append('key', result.Key);
				formData.append('acl', result.Acl);
				formData.append('policy', result.Policy);
				formData.append('Content-Type', result.ContentType);
				formData.append('success_action_status', result.SuccessActionStatus);
				formData.append('success_action_redirect', result.SuccessActionRedirect);
				formData.append('x-amz-algorithm', result.Algorithm);
				formData.append('x-amz-credential', result.Credential);
				if (result.SessionToken) {
					formData.append('x-amz-security-token', result.SessionToken);
				}
				formData.append('x-amz-date', result.Date);
				formData.append('x-amz-signature', result.Signature);
				formData.append('file', this._file);

				const xhr = new XMLHttpRequest();
				xhr.addEventListener('load', (loaded) => {
					if (loaded.target.status === 200) {
						onUploadSuccess();
					} else {
						if (retryAttempt < this._maxRetryAttempts) {
							this._uploadVideoNote(retryAttempt + 1);
						} else {
							this._handleError();
						}
					}
				});
				xhr.addEventListener('error', () => {
					this._handleError();
				});
				xhr.open('POST', result.ActionUrl, true);
				xhr.send(formData);
			} else {
				this._handleError(result);
			}
		};
		D2L.Rpc.Create('GetUploadForm', callback, this._rpcAddress).Call(getExtension(this._file.name), 'null', this._contentType === AUDIO);
	}
}

customElements.define('d2l-media-web-recording', D2LMediaWebRecording);
