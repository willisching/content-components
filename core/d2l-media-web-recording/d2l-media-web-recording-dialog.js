import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/dialog/dialog.js';

import { css, html, LitElement } from 'lit';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import './d2l-media-web-recording.js';

class D2LMediaWebRecordingDialog extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			tenantId: { type: String, attribute: 'tenant-id' },
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			clientApp: { type: String, attribute: 'client-app' },
			canCaptureVideo: { type: Boolean, attribute: 'can-capture-video' },
			canCaptureAudio: { type: Boolean, attribute: 'can-capture-audio' },
			canUpload: { type: Boolean, attribute: 'can-upload' },
			autoCaptionsEnabled: { type: Boolean, attribute: 'auto-captions-enabled' },
			maxFileSizeInBytes: { type: Number, attribute: 'max-file-size' },
			audioRecordingDurationLimit: { type: Number, attribute: 'audio-recording-duration-limit' },
			videoRecordingDurationLimit: { type: Number, attribute: 'video-recording-duration-limit' },
			_primaryButtonDisabled: { type: Boolean, attribute: false },
			_isRecordOrUploadView: { type: Boolean, attribute: false },
		};
	}

	static get styles() {
		return css`
			.d2l-media-web-recording-container {
				height: 450px;
			}
		`;
	}

	constructor() {
		super();
		this._primaryButtonDisabled = true;
	}

	firstUpdated() {
		super.firstUpdated();
		this._mediaWebRecorder = this.shadowRoot.querySelector('d2l-media-web-recording');
	}

	render() {
		return html`
			<d2l-dialog
				id="media-web-recording-dialog"
				class="d2l-media-web-recording-dialog"
				title-text="${this.localize('mediaCapture')}"
				width="800"
				@d2l-dialog-close=${this._handleRecorderClose}
			>
				<div class="d2l-media-web-recording-container">
					<d2l-media-web-recording
							tenant-id="${this.tenantId}"
							content-service-endpoint="${this.contentServiceEndpoint}"
							client-app=${this.clientApp}
							?can-capture-audio=${this.canCaptureAudio}
							?can-capture-video=${this.canCaptureVideo}
							?can-upload=${this.canUpload}
							?auto-captions-enabled=${this.autoCaptionsEnabled}
							max-file-size=${this.maxFileSizeInBytes}
							audio-recording-duration-limit=${this.audioRecordingDurationLimit}
							video-recording-duration-limit=${this.videoRecordingDurationLimit}
							@capture-clip-completed=${this._enablePrimaryButton}
							@file-selected=${this._enablePrimaryButton}
							@capture-started=${this._handleCaptureStartedEvent}
							@metadata-input=${this._handleMetadataInputChangedEvent}
							@upload-success=${this._handleUploadSuccess}
							@processing-started=${this._handleProcessingStarted}
						>
					</d2l-media-web-recording>
				</div>
				<d2l-button
					slot="footer"
					?disabled=${this._primaryButtonDisabled}
					primary
					@click=${this._handlePrimaryButtonClick}
				>
					${this.localize(this._isRecordOrUploadView ? 'next' : 'finish')}
				</d2l-button>
				${!this._isRecordOrUploadView ? html`
					<d2l-button
						slot="footer"
						@click=${this._showRecordOrUploadView}
					>
						${this.localize('back')}
					</d2l-button>` : ''}
				<d2l-button
					slot="footer"
					dialog-action
				>
					${this.localize('cancel')}
				</d2l-button>
			</d2l-dialog>
		`;
	}

	open() {
		this._showRecordOrUploadView();
		this.shadowRoot.getElementById('media-web-recording-dialog').open();
	}

	_enablePrimaryButton() {
		this._primaryButtonDisabled = false;
	}

	_handleCaptureStartedEvent() {
		this._primaryButtonDisabled = true;
	}

	_handleMetadataInputChangedEvent(event) {
		this._primaryButtonDisabled = !event.detail.valid;
	}

	async _handlePrimaryButtonClick() {
		this._primaryButtonDisabled = true;
		if (this._mediaWebRecorder.fileSelected && this._mediaWebRecorder.metadataReady) {
			await this._mediaWebRecorder.processMediaObject();
		} else if (this._mediaWebRecorder.fileSelected && !this._fileUploaded) {
			await this._mediaWebRecorder.uploadSelectedFile();
		}
	}

	_handleProcessingStarted() {
		this.shadowRoot.getElementById('media-web-recording-dialog').removeAttribute('opened');
	}

	_handleRecorderClose() {
		this._mediaWebRecorder.reset();
		this._fileUploaded = false;
	}

	_handleUploadSuccess() {
		this._primaryButtonDisabled = !this._mediaWebRecorder.metadataReady;
		this._fileUploaded = true;
		this._isRecordOrUploadView = false;
	}

	_showRecordOrUploadView() {
		this._mediaWebRecorder.showRecordOrUploadView();
		this._isRecordOrUploadView = true;
		this._primaryButtonDisabled = true;
	}
}

customElements.define('d2l-media-web-recording-dialog', D2LMediaWebRecordingDialog);
