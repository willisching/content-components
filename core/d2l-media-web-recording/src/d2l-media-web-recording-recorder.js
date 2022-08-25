import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/switch/switch.js';

import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin';
import { Uploader } from '../../../util/uploader';
import RecordRTC from '../util/recordrtc';

class D2LMediaWebRecordingRecorder extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			canCaptureAudio: { type: Boolean, attribute: 'can-capture-audio' },
			canCaptureVideo: { type: Boolean, attribute: 'can-capture-video' },
			smallPreview: { type: Boolean, attribute: 'small-preview' },
			maxPreviewHeight: { type: Number, attribute: 'max-preview-height' },
			audioRecordingDurationLimit: { type: Number, attribute: 'audio-recording-duration-limit' },
			videoRecordingDurationLimit: { type: Number, attribute: 'video-recording-duration-limit' },
			_audioOnly: { type: Number, attribute: false },
			_audioToggleDisabled: { type: Boolean, attribute: false },
			_canRecord: { type: Boolean, attribute: false },
			_isRecording: { type: Boolean, attribute: false }
		};
	}

	static get styles() {
		return css`
			.d2l-media-recorder-container {
				text-align: center;
			}

			.d2l-preview-container {
				display: flex;
				min-height: 300px;
			}

			.d2l-preview-controls {
				display: inline-block;
				width: 80%;
				border: 1px solid #494c4e;
				border-radius: 5px;
				padding: 10px;
			}

			.d2l-audio-toggle {
				padding: 2px 0 0 10px;
				float: left;
			}

			.d2l-record-button {
				float: left;
			}

			.d2l-recorder-controls-duration {
				color: #333;
				font-size: 1.3em;
				float: right;
				padding-top: 6px;
			}
			
			.d2l-preview {
				margin: 0 auto 5px;
			}

			.d2l-audio-preview {
				width: 400px;
				align-self: flex-end;
			}

			.small-video-preview {
				max-width: 400px;
			}

			.hidden {
				display: none;
			}
		`;
	}

	constructor() {
		super();
		this._audioVideoRecorder = null;
		this._recordingDuration = 0;
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
		this._canRecord = this.canCaptureAudio || this.canCaptureVideo;
		if (!this.canCaptureVideo && this.canCaptureAudio) {
			this._audioOnly = true;
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._stopTracks();
	}

	async firstUpdated() {
		super.firstUpdated();
		// the recorder defaults to video if canCaptureVideo=true, but if no video input devices
		// are available, the recorder will fall back to audio if canCaptureAudio=true
		await this._getUserMediaStream(!this._audioOnly && this.canCaptureAudio);
	}

	render() {
		return this._canRecord ? this._renderRecorder() : this._renderPermissionError();
	}

	get _activePreview() {
		const activePreviewId = this._audioOnly ? 'audio-preview' : 'video-preview';
		return this.shadowRoot?.getElementById(activePreviewId);
	}

	_dispatchCaptureClipCompletedEvent() {
		this.dispatchEvent(new CustomEvent('capture-clip-completed', {
			bubbles: true,
			composed: true,
			detail: {
				mediaBlob: this._mediaBlob,
				extension: this._extension,
				contentType: this._audioOnly ? 'Audio' : 'Video'
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

	async _getUserMediaStream(fallbackToAudio) {
		if (this.canCaptureAudio || this.canCaptureVideo) {
			this._audioToggleDisabled = true;
			try {
				this._stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: !this._audioOnly && this.canCaptureVideo
				});
				this._canRecord = true;
				this._setExtension();
				this._resetPreview();
			} catch (error) {
				// only display the permission error if the recorder can't fallback to audio
				if (fallbackToAudio) {
					this._audioOnly = true;
					await this._getUserMediaStream();
				} else {
					this._canRecord = false;
				}
			} finally {
				this._audioToggleDisabled = false;
			}
		}
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
		const videoPreviewStyles = ['d2l-preview'];
		const audioPreviewStyles = ['d2l-preview', 'd2l-audio-preview'];
		if (this.smallPreview) {
			videoPreviewStyles.push('small-video-preview');
		}
		if (!(this._audioOnly && this._mediaBlob)) {
			audioPreviewStyles.push('hidden');
		}
		if (this._audioOnly) {
			videoPreviewStyles.push('hidden');
		}
		return html`
			<div
				id="media-recorder"
				class="d2l-media-recorder-container"
			>
				<div class="d2l-preview-container" style="height: ${this.maxPreviewHeight}px;">
					<video id="video-preview" class="${videoPreviewStyles.join(' ')}">
					</video>
					<div></div>
					<audio id="audio-preview" class="${audioPreviewStyles.join(' ')}" controls>
					</audio>
				</div>
				<div class="d2l-preview-controls">
					<d2l-button
						class="d2l-record-button"
						@click=${this._toggleStartStop}
						primary
					>
						${this._isRecording ? this.localize('stopRecording') : this.localize('newRecording')}
					</d2l-button>
					${this.canCaptureAudio && this.canCaptureVideo ? html`
						<d2l-switch
						class="d2l-audio-toggle"
							text="${this.localize('audioOnly')}"
							?on=${this._audioOnly}
							?disabled=${this._audioToggleDisabled}
							@change=${this._toggleAudioOnly}
						></d2l-switch>` : ''}
					<div class="d2l-recorder-controls-duration">
						<span id="current-time">
							00:00
						</span>
						<span>/</span>
						<span id="recording-limit">
							${this._formatTime(this._audioOnly ? this.audioRecordingDurationLimit : this.videoRecordingDurationLimit * 60)}
						</span>
					</div>
				</div>
			</div>
		`;
	}

	_resetPreview() {
		if (!this._activePreview) {
			return;
		}
		try {
			this._activePreview.srcObject = this._stream;
		} catch (error) {
			this._activePreview.src = URL.createObjectURL(this._stream);
		}
		this._activePreview.muted = true;
		this._activePreview.controls = this._audioOnly;
		if (!this._audioOnly) {
			this._activePreview.play();
		}
	}

	_setExtension() {
		const isFirefox = typeof InstallTrigger !== 'undefined';
		this._extension = this._audioOnly ? (isFirefox ? 'ogg' : 'wav') : 'webm';
	}

	_startRecording() {
		if (!this._stream) return;
		if (this._mediaBlob) {
			this._resetPreview();
			this._recordingDuration = 0;
			this._mediaBlob = null;
		}
		this._isRecording = true;
		this._audioToggleDisabled = true;
		const recorderSettings = this._audioOnly ? {
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
			bitsPerSecond: 1500000
		};
		this._audioVideoRecorder = new RecordRTC.RecordRTCPromisesHandler(this._stream, recorderSettings);
		this._audioVideoRecorder.startRecording();
		this._timer(true);
		this._dispatchCaptureStartedEvent();
	}

	async _stopRecording() {
		this._cancelTimer = true;

		await this._audioVideoRecorder.stopRecording();
		const url = this._audioVideoRecorder.recordRTC.toURL();
		this._mediaBlob = await this._audioVideoRecorder.getBlob();
		this._activePreview.muted = false;
		this._activePreview.controls = true;
		this._activePreview.src = url;
		this._activePreview.srcObject = null;
		this._activePreview.load();
		this._activePreview.play();

		this._isRecording = false;
		this._dispatchCaptureClipCompletedEvent();
	}

	_stopTracks() {
		if (this._stream) {
			this._stream.getTracks().forEach(track => track.stop());
			this._stream = null;
		}
	}

	async _timer(init) {
		if (this._recordingDuration >= this.recordingDurationLimit * 60) {
			await this._stopRecording();
		}
		if (!this._cancelTimer) {
			if (!init) {
				this._recordingDuration += 1;
			}
			this.shadowRoot.getElementById('current-time').textContent = this._formatTime(this._recordingDuration);
			window.setTimeout(this._timer.bind(this), 1000);
		}
		this._cancelTimer = false;
	}

	async _toggleAudioOnly() {
		if (!this._audioToggleDisabled) {
			this._audioOnly = !this._audioOnly;
			this._stopTracks();
			this._setExtension();
			await this._getUserMediaStream();
		}
	}

	_toggleStartStop() {
		if (this._isRecording) {
			this._stopRecording();
		} else {
			this._startRecording();
		}
	}
}

customElements.define('d2l-media-web-recording-recorder', D2LMediaWebRecordingRecorder);
