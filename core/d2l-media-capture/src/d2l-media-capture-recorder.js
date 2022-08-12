import '@brightspace-ui/core/components/button/button.js';

import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin';
import { Uploader } from '../../../util/uploader';
import RecordRTC from '../util/recordrtc';

class D2LMediaCaptureRecorder extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			isAudio: { type: Boolean, attribute: 'is-audio' },
			canCapture: { type: Boolean, attribute: 'can-capture' },
			recordingDurationLimit: { type: Number, attribute: 'recording-duration-limit' },
			_canRecord: { type: Boolean, attribute: false },
			_isRecording: { type: Boolean, attribute: false }
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
				display: inline-block;
				color: #333;
				font-size: 1.3em;
				float: right;
				padding-top: 4px;
			}

			.d2l-mediaplayer-audio {
				width: 400px;
				margin-top: 3px;
			}

			.hidden {
				display: none;
			}

			.visible {
				display: block;
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
	}

	async connectedCallback() {
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
		this._canRecord = this.canCapture || this.isAudio;
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this._stream) {
			this._stream.getTracks().forEach(track => track.stop());
		}
	}

	async firstUpdated() {
		super.firstUpdated();

		if (this._canRecord) {
			try {
				this._stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: !this.isAudio });
				this._resetPlayer();
				this.dispatchEvent(new CustomEvent('user-devices-loaded', {
					bubbles: true,
					composed: true
				}));
			} catch (error) {
				this._canRecord = false;
			}
		}
	}

	render() {
		return this._canRecord ? this._renderRecorder() : this._renderPermissionError();
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

	_dispatchCaptureStartedEvent() {
		this.dispatchEvent(new CustomEvent('capture-started', {
			bubbles: true,
			composed: true
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

	get _mediaPreview() {
		return this.shadowRoot?.querySelector('#media-preview');
	}

	_renderPermissionError() {
		return html`
			<div
				id="permission-error"
				role="alert"
			>
				<span>${this.localize('recorderPermissionError')}</span>
			</div>
		`;
	}

	_renderRecorder() {
		return html`
			<div
				id="media-recorder"
				class="d2l-media-recorder-container"
			>
				${!this.isAudio ? html`
					<div class="d2l-video-container">
						<video id="media-preview">
						</video>
					</div>` : ''}
				<div class="d2l-video-controls">
					<d2l-button
						class="d2l-video-controls-button"
						@click=${this._toggleStartStop}
						primary
					>
						${this._isRecording ? this.localize('stopRecording') : this.localize('newRecording')}
					</d2l-button>
					<div class="d2l-video-controls-duration">
						<span id="current-time">
							00:00
						</span>
						<span>/</span>
						<span id="recording-limit">
							${this._formatTime(this.recordingDurationLimit * 60)}
						</span>
					</div>
				</div>
				${this.isAudio ? html`
					<div id="audio-container" class="d2l-audio-container ${this._mediaBlob ? 'visible' : 'hidden'}">
						<audio id="media-preview" class="d2l-mediaplayer-audio" controls>
						</audio>
					</div>` : ''}
			</div>
		`;
	}

	_resetPlayer() {
		try {
			this._mediaPreview.srcObject = this._stream;
		} catch (error) {
			this._mediaPreview.src = URL.createObjectURL(this._stream);
		}
		this._mediaPreview.muted = true;
		this._mediaPreview.controls = this.isAudio;
		if (!this.isAudio) {
			this._mediaPreview.play();
		}
	}

	_startRecording() {
		if (this._mediaBlob) {
			this._resetPlayer();
			this._recordingDuration = 0;
			this._videoRecorded = false;
			this._mediaBlob = null;
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
		this._audioVideoRecorder = new RecordRTC.RecordRTCPromisesHandler(this._stream, recorderSettings);
		this._audioVideoRecorder.startRecording();
		this._isRecording = true;
		this._timer();
		this._dispatchCaptureStartedEvent();
	}

	async _stopRecording() {
		await this._audioVideoRecorder.stopRecording();
		const url = this._audioVideoRecorder.recordRTC.toURL();
		this._mediaBlob = await this._audioVideoRecorder.getBlob();
		this._mediaPreview.muted = false;
		this._mediaPreview.controls = true;
		this._mediaPreview.src = url;
		this._mediaPreview.srcObject = null;
		this._mediaPreview.load();
		this._mediaPreview.play();
		this._isRecording = false;
		this._cancelTimer = true;
		this._dispatchCaptureClipCompletedEvent();
	}

	async _timer() {
		if (this._recordingDuration >= this.recordingDurationLimit * 60) {
			await this._stopRecording();
		}
		if (!this._cancelTimer) {
			this._recordingDuration += 1;
			this.shadowRoot.querySelector('#current-time').textContent = this._formatTime(this._recordingDuration);
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
