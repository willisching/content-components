import '@brightspace-ui/core/components/button/button.js';

import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin';
import { Uploader } from '../../../util/uploader';

class D2LMediaCaptureRecorder extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			isAudio: { type: Boolean, attribute: 'is-audio' },
			recordingDurationLimit: { type: Number, attribute: 'recording-duration-limit' }
		};
	}

	static get styles() {
		return css`
			.d2l-media-recorder-container {
				text-align: center;
			}

			.d2l-video-controls {
				display: inline-block;
				width: 80%;
				border: 1px solid #494c4e;
				border-radius: 5px;
				padding: 10px;
			}

			.d2l-video-controls-button {
				float: left;
			}

			.d2l-video-controls-duration {
				float: right;
			}
		`;
	}

	constructor() {
		super();
		this._audioVideoRecorder = null;
		this._recordingDuration = 0;
		this._videoRecorded = false;
		this._mediaBlob = null;
		this._isRecording = false;
		this._cancelTimer = false;
		this._canRecord = true;
	}

	connectedCallback() {
		super.connectedCallback();
		const apiClient = new ContentServiceApiClient({
			httpClient: new ContentServiceBrowserHttpClient({ serviceUrl: this.contentServiceEndpoint }),
			tenantId: this.tenantId
		});
		this._uploader = new Uploader({
			apiClient
		});
		const isFirefox = typeof InstallTrigger !== 'undefined';
		this._extension = this.isAudio ? (isFirefox ? 'ogg' : 'wav') : 'webm';
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._stream.getTracks().forEach(track => track.stop());
	}

	async firstUpdated() {
		super.firstUpdated();

		try {
			this._stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: !this.isAudio });
		} catch (error) {
			this.shadowRoot.querySelector('#media-recorder').style.display = 'none';
			this.shadowRoot.querySelector('#permission-error').style.display = 'inherit';
		}
		await this._resetPlayer();
		this.dispatchEvent(new CustomEvent('user-devices-loaded', {
			bubbles: true,
			composed: true
		}));
	}

	render() {
		return html`
		<div id="media-recorder" class="d2l-media-recorder-container">
			${!this.isAudio ? html`
				<div class="d2l-video-container">
					<video id="media-preview">
					</video>
				</div>
			` : ''}
			<div class="d2l-video-controls">
				<d2l-button
					class="d2l-video-controls-button"
					@click=${this._toggleStartStop}
					primary
				>
					${this._isRecording ? this.localize('stopRecording') : this.localize('newRecording')}
				</d2l-button>
				<div class="d2l-video-controls-duration">
					<span id="currentTime">
						00:00
					</span>
					<span>/</span>
					<span id="recording-limit">
						${this._formatTime(this.recordingDurationLimit * 60)}
					</span>
				</div>
			</div>
			${this.isAudio ? html`
				<div id="audio-container" class="d2l-audio-container">
					<audio id="media-preview" controls>
					</audio>
				</div>
			` : ''}
		</div>
		<div id="permission-error" role="alert" style="display:none">
			<span>${this.localize('recorderPermissionError')}</span>
		</div>
	`;
	}

	get currentTimeIndicator() {
		return this.shadowRoot.querySelector('#currentTime');
	}

	get mediaPreview() {
		return this.shadowRoot?.querySelector('#media-preview');
	}

	_dispatchCaptureClearedEvent() {
		this.dispatchEvent(new CustomEvent('capture-cleared', {
			bubbles: true,
			composed: true
		}));
	}

	_dispatchCaptureClipCompletedEvent() {
		this.dispatchEvent(new CustomEvent('capture-clip-completed', {
			bubbles: true,
			composed: true,
			detail: {
				mediaBlob: this._mediaBlob,
				extension: this._extension
			}
		}));
	}

	_formatTime(time) {
		let timeFormatted = '';

		let durationSeconds = time;
		const durationMinutes = Math.floor(durationSeconds / 60);
		durationSeconds = durationSeconds - (durationMinutes * 60);

		if (durationMinutes < 10) {
			timeFormatted += '0';
		}
		timeFormatted += durationMinutes;
		timeFormatted += ':';

		if (durationSeconds < 10) {
			timeFormatted += '0';
		}
		timeFormatted += durationSeconds;

		return timeFormatted;
	}

	async _resetPlayer() {
		try {
			this.mediaPreview.srcObject = this._stream;
		} catch (error) {
			this.mediaPreview.src = URL.createObjectURL(this._stream);
		}
		this.mediaPreview.muted = true;
		this.mediaPreview.controls = this.isAudio;
		if (!this.isAudio) {
			await this.mediaPreview.play();
		} else {
			this.shadowRoot.querySelector('#audio-container').style.display = 'none';
		}
	}

	async _startRecording() {
		if (this._mediaBlob) {
			await this._resetPlayer();
			this._recordingDuration = 0;
			this._videoRecorded = false;
			this._mediaBlob = null;
			this._dispatchCaptureClearedEvent();
		}
		const recorderSettings = this.isAudio ? {
			type: 'audio',
			mimetype: this._extension
		} : {
			type: 'video',
			mimetype: 'video/webm',
			video: {
				frameRate: { max: 24 },
				width: { min: 320, ideal: 640, max: 640 },
				height: { min: 240, ideal: 480, max: 480 }
			},
			bitsPerSecond: 500000
		};
		this._audioVideoRecorder = new window.RecordRTCPromisesHandler(this._stream, recorderSettings);
		this._audioVideoRecorder.startRecording();
		this._isRecording = true;
		this._timer();
		this.requestUpdate();
	}

	async _stopRecording() {
		await this._audioVideoRecorder.stopRecording();
		if (this.isAudio) {
			this.shadowRoot.querySelector('#audio-container').style.display = 'inline-block';
		}
		const url = this._audioVideoRecorder.recordRTC.toURL();
		this._mediaBlob = await this._audioVideoRecorder.getBlob();
		this.mediaPreview.muted = false;
		this.mediaPreview.controls = true;
		this.mediaPreview.src = url;
		this.mediaPreview.srcObject = null;
		this.mediaPreview.load();
		this.mediaPreview.play();
		this._isRecording = false;
		this._cancelTimer = true;
		this._dispatchCaptureClipCompletedEvent();
		this.requestUpdate();
	}

	async _timer() {
		if (this._recordingDuration >= this.recordingDurationLimit * 60) {
			await this._stopRecording();
		}
		if (!this._cancelTimer) {
			this._recordingDuration += 1;
			this.currentTimeIndicator.textContent = this._formatTime(this._recordingDuration);
			window.setTimeout(this._timer.bind(this), 1000);
		}
		this._cancelTimer = false;
	}

	_toggleStartStop() {
		if (this._isRecording) {
			this._stopRecording();
		} else {
			this._startRecording();
		}
	}

}

customElements.define('d2l-media-capture-recorder', D2LMediaCaptureRecorder);
