import 'file-drop-element';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import { bodyCompactStyles, bodySmallStyles, bodyStandardStyles, heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { css, html, LitElement } from 'lit-element';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin';

class ContentFileDrop extends DependencyRequester(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			_supportedMimeTypes: { type: Array, attribute: false },
			enableFileDrop: { type: Boolean, attribute: 'enable-file-drop', reflect: true },
			errorMessage: { type: String, attribute: 'error-message', reflect: true }
		};
	}

	static get styles() {
		return [ bodySmallStyles, bodyStandardStyles, heading2Styles, bodyCompactStyles, css`
			file-drop {
				display: block;
				border: 2px dashed var(--d2l-color-corundum);
				padding: 40px 40px 10px 40px;
			}
			@media screen and (max-width: 480px) {
				#no-file-drop-container {
					display: block;
					padding: 30vh 20px 10px 20px;
				}
			}
			@media screen and (min-width: 481px) {
				#no-file-drop-container {
					display: block;
					padding: 8vh 20px 10px 20px;
				}
			}
			file-drop.drop-valid {
				background-color: var(--d2l-color-gypsum);
				border: 2px dashed var(--d2l-color-feedback-action);
			}
			file-drop.drop-invalid {
				background-color: var(--d2l-color-gypsum);
				border: 2px dashed var(--d2l-color-feedback-error);
			}
			#file-select {
				display: none;
			}
			#file-size-limit {
				margin-top: 20px;
			}
			#error-message {
				color: var(--d2l-color-feedback-error);
			}
		`];
	}

	constructor() {
		super();
		this._supportedMimeTypes = [];
		this.enableFileDrop = false;
	}

	async connectedCallback() {
		super.connectedCallback();

		this.client = this.requestDependency('content-service-client');
		this._supportedMimeTypes = (await this.client.getSupportedMimeTypes())
			.filter(x => x.startsWith('video/') || x.startsWith('audio/'));
	}

	render() {
		const browseFileSection = html`
			<d2l-button
				description=${this.localize('browseForFile')}
				@click=${this.onBrowseClick}
				>
				${this.localize('browse')}
				<input
					id="file-select"
					type="file"
					accept=${this._supportedMimeTypes.join(',')}
					@change=${this.onFileInputChange} />
			</d2l-button>
			<p id="file-size-limit" class="d2l-body-small">${this.localize('fileLimit1Gb')}</p>
		`;
		const errorMessageText = html`<p id="error-message" class="d2l-body-compact">${this.errorMessage}&nbsp;</p>`;

		if (this.enableFileDrop) {
			return html`
				<file-drop @filedrop=${this.onFileDrop} accept=${this._supportedMimeTypes.join(',')}>
					<center>
						<h2 class="d2l-heading-2">${this.localize('dropAudioVideoFile')}</h2>
						<p class="d2l-body-standard">${this.localize('or')}</p>
						${browseFileSection}
						${errorMessageText}
					</center>
				</file-drop>
			`;
		} else {
			return html`
				<div id="no-file-drop-container">
					<center>
						${browseFileSection}
						${errorMessageText}
					</center>
				</div>
			`;
		}
	}

	onBrowseClick() {
		this.shadowRoot.getElementById('file-select').click();
	}

	onFileDrop(event) {
		this.stageFile(event._files);
	}

	onFileInputChange(event) {
		this.stageFile(event.target.files);
	}

	stageFile(files) {
		if (files.length !== 1) {
			this.dispatchEvent(new CustomEvent('upload-error', {
				detail: {
					message: this.localize('mayOnlyUpload1File')
				},
				bubbles: true,
				composed: true
			}));
			return;
		}

		const file = files[0];
		if (!this._supportedMimeTypes.includes(file.type)) {
			this.dispatchEvent(new CustomEvent('upload-error', {
				detail: {
					message: this.localize('invalidFileType')
				},
				bubbles: true,
				composed: true
			}));
			return;
		}
		if (file.size > Math.pow(2, 30)) {
			this.dispatchEvent(new CustomEvent('upload-error', {
				detail: {
					message: this.localize('fileTooLarge')
				},
				bubbles: true,
				composed: true
			}));
			return;
		}

		this.dispatchEvent(new CustomEvent('stage-file-for-upload', {
			detail: { file },
			bubbles: true,
			composed: true
		}));
	}
}

window.customElements.define('content-file-drop', ContentFileDrop);
