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
			isVideoNote: { type: Boolean, attribute: 'is-video-note' },
			isAudio: { type: Boolean, attribute: 'is-audio' },
			canCapture: { type: Boolean, attribute: 'can-capture' },
			canUpload: { type: Boolean, attribute: 'can-upload' },
			maxFileSizeInBytes: { type: Number, attribute: 'max-file-size' },
			_primaryButtonDisabled: { type: Boolean, attribute: false }
		};
	}

	static get styles() {
		return css`
			.d2l-media-capture-dialog {
				padding-top: 25px;
			}

			.d2l-media-capture-container {
				min-height: 560px;
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
							?is-video-note=${this.isVideoNote}
							?is-audio=${this.isAudio}
							?can-capture=${this.canCapture}
							?can-upload=${this.canUpload}
							max-file-size=${this.maxFileSizeInBytes}
							recording-duration-limit="3"
							@user-devices-loaded=${this._handleUserDevicesLoaded}
							@capture-clip-completed=${this._enablePrimaryButton}
							@file-selected=${this._enablePrimaryButton}
							@capture-cleared=${this._handleCaptureClearedEvent}
							@upload-success=${this._enablePrimaryButton}
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
					${this.localize('next')}
				</d2l-button>
				<d2l-button
				  slot="footer"
					@click=${this._handleBackButtonClick}
				>
					${this.localize('back')}
				</d2l-button>
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
		this._mediaCapture.showRecordOrUploadView();
		this.shadowRoot.querySelector('#media-capture-dialog').open();
	}

	_enablePrimaryButton() {
		this._primaryButtonDisabled = false;
	}

	_handleBackButtonClick() {
		this._mediaCapture.showRecordOrUploadView();
	}

	_handleCaptureClearedEvent() {
		this._primaryButtonDisabled = true;
	}

	async _handlePrimaryButtonClick() {
		this._primaryButtonDisabled = true;
		if (this._mediaCapture.fileSelected && this._mediaCapture.metadataReady) {
			await this._mediaCapture.processMediaObject();
		} else if (this._mediaCapture.fileSelected) {
			await this._mediaCapture.uploadSelectedFile();
		}
	}

	_handleProcessingStarted() {
		this.shadowRoot.querySelector('#media-capture-dialog').removeAttribute('opened');
	}

	_handleRecorderClose() {
		this._mediaCapture.reset();
	}

	_handleUserDevicesLoaded() {
		this.shadowRoot.querySelector('#media-capture-dialog').resize();
		this.requestUpdate();
	}

}

customElements.define('d2l-media-capture-dialog', D2LMediaCaptureDialog);
