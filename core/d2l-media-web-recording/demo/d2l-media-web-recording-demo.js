import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui/core/components/inputs/input-number.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';
import '../d2l-media-web-recording-dialog.js';

import { css, html, LitElement } from 'lit';

class DemoMediaWebRecording extends LitElement {
	static get properties() {
		return {
			_maxFileSizeInBytes: { type: Number, attribute: false },
			_audioRecordingDurationLimit: { type: Number, attribute: false },
			_videoRecordingDurationLimit: { type: Number, attribute: false },
			_canCaptureAudio: { type: Boolean, attribute: false },
			_canCaptureVideo: { type: Boolean, attribute: false },
			_canUpload: { type: Boolean, attribute: false },
			_autoCaptionsEnabled: { type: Boolean, attribute: false },
			_alertMessage: { type: String, attribute: false }
		};
	}

	static get styles() {
		return css`
			.input-column {
				width: 300px;
			}
		`;
	}

	constructor() {
		super();
		this._maxFileSizeInBytes = 5 * 1024 * 1024 * 1024;
		this._audioRecordingDurationLimit = 60;
		this._videoRecordingDurationLimit = 3;
		this._canCaptureAudio = true;
		this._canCaptureVideo = true;
		this._canUpload = true;
		this._autoCaptionsEnabled = true;
	}

	render() {
		return html`
			<div class="demo-media-web-recording">
				<div>
					<table>
						<tbody>
							<tr>
								<td class="label-column">
									<label id="max-file-size-label">Max file size in bytes</label>
								</td>
								<td class="input-column">
									<d2l-input-number
										id="max-file-size-input"
										labelled-by="max-file-size-label"
										input-width="8rem"
										min=0
										value=${this._maxFileSizeInBytes}
										@change=${this._handleMaxFileSizeChange}
									></d2l-input-number>
								</td>
							</tr>
							<tr>
								<td class="label-column">
									<label id="audio-duration-label">Audio recording duration limit (seconds)</label>
								</td>
								<td>
									<d2l-input-number
										id="audio-duration-input"
										labelled-by="audio-duration-label"
										input-width="8rem"
										min=0
										value=${this._audioRecordingDurationLimit}
										@change=${this._handleAudioRecordingDurationLimitChange}
									>
									</d2l-input-number>
								</td>
							</tr>
							<tr>
								<td class="label-column">
									<label id="video-duration-label">Video recording duration limit (minutes)</label>
								</td>
								<td>
									<d2l-input-number
										id="video-duration-input"
										labelled-by="video-duration-label"
										input-width="8rem"
										min=0
										value=${this._videoRecordingDurationLimit}
										@change=${this._handleVideoRecordingDurationLimitChange}
									>
									</d2l-input-number>
								</td>
							</tr>
						</tbody>
					</table>
					<d2l-input-checkbox
						?checked=${this._canCaptureAudio}
						@change=${this._handleCanCaptureAudioCheckbox}
					>Can capture audio</d2l-input-checkbox>
					<d2l-input-checkbox
						?checked=${this._canCaptureVideo}
						@change=${this._handleCanCaptureVideoCheckbox}
					>Can capture video</d2l-input-checkbox>
					<d2l-input-checkbox
						?checked=${this._canUpload}
						@change=${this._handleCanUploadCheckbox}
					>Can upload</d2l-input-checkbox>
					<d2l-input-checkbox
						?checked=${this._autoCaptionsEnabled}
						@change=${this._handleCaptionsCheckbox}
					>Autogenerate captions enabled</d2l-input-checkbox>
				</div>
				<div>
					<d2l-button
						@click=${this._openMediaWebRecordingDialog()}
						primary
					>Record</d2l-button>
				</div>
				<d2l-media-web-recording-dialog
					id="can-capture-dialog"
					tenant-id="0"
					content-service-endpoint="http://localhost:8000/contentservice"
					max-file-size=${this._maxFileSizeInBytes}
					audio-recording-duration-limit="${this._audioRecordingDurationLimit}"
					video-recording-duration-limit="${this._videoRecordingDurationLimit}"
					?can-capture-video=${this._canCaptureVideo}
					?can-capture-audio=${this._canCaptureAudio}
					?can-upload=${this._canUpload}
					?auto-captions-enabled=${this._autoCaptionsEnabled}
					@processing-started=${this._handleProcessingStarted}
				>
				</d2l-media-web-recording-dialog>
				<d2l-media-web-recording-dialog
					id="no-capture-dialog"
					tenant-id="0"
					content-service-endpoint="http://localhost:8000/contentservice"
					max-file-size=${this._maxFileSizeInBytes}
					audio-recording-duration-limit="${this._audioRecordingDurationLimit}"
					video-recording-duration-limit="${this._videoRecordingDurationLimit}"
					?can-upload=${this._canUpload}
					?auto-captions-enabled=${this._autoCaptionsEnabled}
					@processing-started=${this._handleProcessingStarted}
				>
				</d2l-media-web-recording-dialog>
				<d2l-alert-toast type="default">
					${this._alertMessage}
				</d2l-alert-toast>
			</div>
		`;
	}

	_handleAudioRecordingDurationLimitChange(event) {
		this._audioRecordingDurationLimit = event.target.value;
	}

	_handleCanCaptureAudioCheckbox(event) {
		this._canCaptureAudio = event.target.checked;
	}

	_handleCanCaptureVideoCheckbox(event) {
		this._canCaptureVideo = event.target.checked;
	}

	_handleCanUploadCheckbox(event) {
		this._canUpload = event.target.checked;
	}

	_handleCaptionsCheckbox(event) {
		this._autoCaptionsEnabled = event.target.checked;
	}

	_handleMaxFileSizeChange(event) {
		this._maxFileSizeInBytes = event.target.value;
	}

	_handleProcessingStarted() {
		this._alertMessage = 'Processing started';
		this.shadowRoot.querySelector('d2l-alert-toast').open = true;
	}

	_handleVideoRecordingDurationLimitChange(event) {
		this._videoRecordingDurationLimit = event.target.value;
	}

	_openMediaWebRecordingDialog() {
		return () => {
			let mediaWebRecordingDialog;
			if (this._canCaptureAudio || this._canCaptureVideo) {
				mediaWebRecordingDialog = this.shadowRoot.getElementById('can-capture-dialog');
			} else {
				mediaWebRecordingDialog = this.shadowRoot.getElementById('no-capture-dialog');
			}
			mediaWebRecordingDialog.open();
		};
	}

}

customElements.define('d2l-media-web-recording-demo', DemoMediaWebRecording);
