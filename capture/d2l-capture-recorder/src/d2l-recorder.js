import '@brightspace-ui/core/components/button/button.js';

import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin';
import { Uploader } from '../../../util/uploader';

class Recorder extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			recordingDurationLimit: { type: Number, attribute: 'recording-duration-limit' }
		};
	}

	static get styles() {
		return css`
			.d2l-media-recorder {
				width: fit-content;
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
		this._videoRecorder = null;
		this._recordingDuration = 0;
		this._videoRecorded = false;
		this._mediaBlob = null;
		this._isRecording = false;
		this._cancelTimer = false;
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._stream = null;
	}

	async firstUpdated() {
		super.firstUpdated();
		const apiClient = new ContentServiceApiClient({
			httpClient: new ContentServiceBrowserHttpClient({ serviceUrl: this.contentServiceEndpoint }),
			tenantId: this.tenantId
		});
		this._uploader = new Uploader({
			apiClient
		});
		try {
			this._stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
		} catch (error) {
			this.shadowRoot.querySelector('#mediaRecorder').style.display = 'none';
			this.shadowRoot.querySelector('#permissionError').style.display = 'inherit';
		}
		this._resetPlayer();
	}

	render() {
		return html`
		<div id="mediaRecorder" class="d2l-media-recorder">
			<div class="d2l-video-container">
				<video id="mediaPreview">
				</video>
			</div>
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
					<span id="recordingLimit">
						${this._formatTime(this.recordingDurationLimit * 60)}
					</span>
				</div>
			</div>
		</div>
		<div id="permissionError" role="alert" style="display:none">
			<span>${this.localize('recorderPermissionError')}</span>
		</div>
	`;
	}

	get currentTimeIndicator() {
		return this.shadowRoot.querySelector('#currentTime');
	}

	get mediaPreview() {
		return this.shadowRoot.querySelector('#mediaPreview');
	}

	_dispatchCaptureClipCompletedEvent() {
		this.dispatchEvent(new CustomEvent('capture-clip-completed', {
			bubbles: true,
			composed: true,
			detail: {
				message: 'blah'
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

	_resetPlayer() {
		this.mediaPreview.srcObject = this._stream;
		// do something with url and mediaPreview.src??
		this.mediaPreview.muted = true;
		this.mediaPreview.controls = false;
		this.mediaPreview.play();
	}

	_startRecording() {
		this._resetPlayer();
		this._videoRecorder = new window.RecordRTCPromisesHandler(this._stream, {
			type: 'video',
			mimetype: 'video/webm',
			video: {
				frameRate: { max: 24 },
				width: { min: 320, ideal: 640, max: 640 },
				height: { min: 240, ideal: 480, max: 480 }
			},
			bitsPerSecond: 500000
		});
		this._recordingDuration = 0;
		this._videoRecorded = false;
		this._mediaBlob = null;
		this._videoRecorder.startRecording();
		this._isRecording = true;
		this._timer();
		this.requestUpdate();
	}

	async _stopRecording() {
		await this._videoRecorder.stopRecording();
		const url = this._videoRecorder.recordRTC.toURL();
		this._mediaBlob = await this._videoRecorder.getBlob();
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

customElements.define('d2l-recorder', Recorder);
