import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin';
import { formatFileSize } from '@brightspace-ui/intl/lib/fileSize';
import { css, html, LitElement } from 'lit';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin';
import { isAudioType, isVideoType } from '../../../util/media-type-util';

class D2LMediaCaptureUploader extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			isAudio: { type: Boolean, attribute: 'is-audio' },
			maxFileSizeInBytes: { type: Number, attribute: 'max-file-size' },
			_localizedError: { type: String, attribute: false }
		};
	}

	static get styles() {
		return css`
			.d2l-media-capture-upload-help {
				padding: 8px 0 12px 2px;
				max-width: 485px;
			}

			.d2l-media-capture-upload-error {
				color: #D00;
				margin-top: 8px;    
				padding: 5px;
				border: 1px solid #FDD;
			}
		`;
	}

	render() {
		return html`
			<div>
				${this._localizedError ? html`
					<div class="d2l-media-capture-upload-error">
						${this._localizedError}
					</div>
				` : ''}
				<div class="d2l-media-capture-upload-help">
					${this.localize(this.isAudio ? 'selectAnAudioFile' : 'selectAFile')}
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

	_handleFileChange(event) {
		const { files } = event.target;
		if (files.length > 0) {
			const file = files[0];
			if (file.size > this.maxFileSizeInBytes) {
				this._localizedError = this.localize(
					this.isAudio ? 'mediaCaptureUploadFailedAudio' : 'mediaCaptureUploadFailed',
					{ localizedMaxFileSize: formatFileSize(this.maxFileSizeInBytes) }
				);
			} else if (this.isAudio && !isAudioType(file.name)) {
				this._localizedError = this.localize('notSupportedAudio');
			} else if (!(this.isAudio || isVideoType(file.name))) {
				this._localizedError = this.localize('notSupportedVideo');
			} else {
				this._localizedError = null;
				this.dispatchEvent(new CustomEvent('file-selected', {
					bubbles: true,
					composed: true,
					detail: { file }
				}));
			}
		}
	}
}

customElements.define('d2l-media-capture-uploader', D2LMediaCaptureUploader);
