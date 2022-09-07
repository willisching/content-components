import { formatFileSize } from '@brightspace-ui/intl/lib/fileSize';
import { css, html, LitElement } from 'lit';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin';
import { isAudioType, isVideoType } from '../../../util/media-type-util';

const ALLOWED_TYPES = Object.freeze({
	AUDIO: 'AUDIO',
	VIDEO: 'VIDEO',
	AUDIO_AND_VIDEO: 'AUDIO_AND_VIDEO'
});

class D2LMediaWebRecordingUploader extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			canUploadAudio: { type: Boolean, attribute: 'can-upload-audio' },
			canUploadVideo: { type: Boolean, attribute: 'can-upload-video' },
			maxFileSizeInBytes: { type: Number, attribute: 'max-file-size' },
			_localizedError: { type: String, attribute: false }
		};
	}

	static get styles() {
		return css`
			.d2l-media-web-recording-upload-help {
				padding: 8px 0 12px 2px;
				max-width: 485px;
			}

			.d2l-media-web-recording-upload-error {
				color: #D00;
				margin-top: 8px;    
				padding: 5px;
				border: 1px solid #FDD;
			}
		`;
	}

	connectedCallback() {
		super.connectedCallback();
		this._allowedType = this.canUploadAudio ?
			(this.canUploadVideo ? ALLOWED_TYPES.AUDIO_AND_VIDEO : ALLOWED_TYPES.AUDIO) :
			ALLOWED_TYPES.VIDEO;
	}

	render() {
		return html`
			<div>
				${this._localizedError ? html`
					<div class="d2l-media-web-recording-upload-error">
						${this._localizedError}
					</div>` : ''}
				<div class="d2l-media-web-recording-upload-help">
					${this._getHelpText()}
				</div>
				<div>
					<input
						type="file"
						name="file"
						@change=${this._handleFileChange}
					/>
				</div>
			</div>
		`;
	}

	_getHelpText() {
		switch (this._allowedType) {
			case ALLOWED_TYPES.AUDIO:
				return this.localize('selectAnAudioFile');
			case ALLOWED_TYPES.VIDEO:
				return this.localize('selectAVideoFile');
			case ALLOWED_TYPES.AUDIO_AND_VIDEO:
				return this.localize('selectAFile');
		}
	}

	_handleFileChange(event) {
		const { files } = event.target;
		if (files.length > 0) {
			const file = files[0];
			const contentType = isAudioType(file.name) ? 'Audio' : 'Video';
			if (file.size > this.maxFileSizeInBytes) {
				this._localizedError = this.localize(
					'mediaCaptureFileSizeError',
					{ localizedMaxFileSize: formatFileSize(this.maxFileSizeInBytes) }
				);
			} else if (
				this._allowedType === ALLOWED_TYPES.AUDIO_AND_VIDEO &&
				!isAudioType(file.name) && !isVideoType(file.name)
			) {
				this._localizedError = this.localize('notSupportedAudioOrVideo');
			} else if (this._allowedType === ALLOWED_TYPES.AUDIO && !isAudioType(file.name)) {
				this._localizedError = this.localize('notSupportedAudio');
			} else if (this._allowedType === ALLOWED_TYPES.VIDEO && !isVideoType(file.name)) {
				this._localizedError = this.localize('notSupportedVideo');
			} else {
				this._localizedError = null;
				this.dispatchEvent(new CustomEvent('file-selected', {
					bubbles: true,
					composed: true,
					detail: {
						file,
						contentType
					}
				}));
			}
		} else {
			this._localizedError = this.localize('noFilesToUpload');
		}
	}
}

customElements.define('d2l-media-web-recording-uploader', D2LMediaWebRecordingUploader);
