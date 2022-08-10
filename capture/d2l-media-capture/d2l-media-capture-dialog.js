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
			isAudio: { type: Boolean, attribute: 'is-audio' },
			_primaryButtonDisabled: { type: Boolean, attribute: false }
		};
	}

	static get styles() {
		return css`
			.d2l-media-capture-dialog {
				padding-top: 25px;
			}

			.d2l-media-capture-container {
				min-height: 550px;
			}
		`;
	}

	constructor() {
		super();
		this._primaryButtonDisabled = true;
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
							?is-audio=${this.isAudio}
							recording-duration-limit="3"
							@user-devices-loaded=${this._handleUserDevicesLoaded}
							@capture-clip-completed=${this._handleCaptureClipCompletedEvent}
							@capture-cleared=${this._handleCaptureClearedEvent}
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
		this.recorder.showRecordView();
		this.shadowRoot.querySelector('#media-capture-dialog').open();
	}

	get recorder() {
		return this.shadowRoot.querySelector('d2l-media-capture');
	}

	_handleBackButtonClick() {
		this.recorder.showRecordView();
	}

	_handleCaptureClearedEvent() {
		this._primaryButtonDisabled = true;
	}

	_handleCaptureClipCompletedEvent() {
		this._primaryButtonDisabled = false;
	}

	async _handlePrimaryButtonClick() {
		this._primaryButtonDisabled = true;
		if (this.recorder.fileSelected && this.recorder.metadataReady) {
			await this.recorder.processMediaObject();
		} else if (this.recorder.fileSelected) {
			await this.recorder.uploadSelectedFile();
		}
	}

	_handleProcessingStarted() {
		this.shadowRoot.querySelector('#media-capture-dialog').removeAttribute('opened');
	}

	_handleRecorderClose() {
		this.recorder.reset();
	}

	_handleUploadSuccess() {
		this._primaryButtonDisabled = false;
	}

	_handleUserDevicesLoaded() {
		this.shadowRoot.querySelector('#media-capture-dialog').resize();
		this.requestUpdate();
	}

}

customElements.define('d2l-media-capture-dialog', D2LMediaCaptureDialog);
