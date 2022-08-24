import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/dialog/dialog.js';

import { css, html, LitElement } from 'lit';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import './d2l-media-capture.js';

class D2LMediaCaptureDialog extends InternalLocalizeMixin(LitElement) {
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
			.d2l-media-capture-container {
				height: 560px;
			}
		`;
	}

	constructor() {
		super();
		this._primaryButtonDisabled = true;
	}

	firstUpdated() {
		super.firstUpdated();
		this._mediaCapture = this.shadowRoot.querySelector('d2l-media-capture');
	}

	render() {
		return html`
			<d2l-dialog
				id="media-capture-dialog"
				class="d2l-media-capture-dialog"
				title-text="${this.localize('mediaCapture')}"
				width="800"
				@d2l-dialog-close=${this._handleRecorderClose}
			>
				<div class="d2l-media-capture-container">
					<d2l-media-capture
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
					</d2l-media-capture>
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
		this.shadowRoot.getElementById('media-capture-dialog').open();
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
		if (this._mediaCapture.fileSelected && this._mediaCapture.metadataReady) {
			await this._mediaCapture.processMediaObject();
		} else if (this._mediaCapture.fileSelected && !this._fileUploaded) {
			await this._mediaCapture.uploadSelectedFile();
		}
	}

	_handleProcessingStarted() {
		this.shadowRoot.getElementById('media-capture-dialog').removeAttribute('opened');
	}

	_handleRecorderClose() {
		this._mediaCapture.reset();
		this._fileUploaded = false;
	}

	_handleUploadSuccess() {
		this._primaryButtonDisabled = !this._mediaCapture.metadataReady;
		this._fileUploaded = true;
		this._isRecordOrUploadView = false;
	}

	_showRecordOrUploadView() {
		this._mediaCapture.showRecordOrUploadView();
		this._isRecordOrUploadView = true;
		this._primaryButtonDisabled = true;
	}
}

customElements.define('d2l-media-capture-dialog', D2LMediaCaptureDialog);
