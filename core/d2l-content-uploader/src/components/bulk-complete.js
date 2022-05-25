import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import { css, html, LitElement } from 'lit-element';
import { bodyStandardStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';

export class BulkComplete extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			fileName: { type: String, attribute: 'file-name', reflect: true },
			totalFiles: { type: Number, attribute: 'total-files' },
			completedFiles: { type: Number, attribute: 'completed-files' },
			bulkErrorMessages: { type: Object, attribute: 'bulk-error-messages' },

			successfulBodyHide: { type: Boolean, attribute: false },
			failedFiles: { type: Number, attribute: false },
		};
	}

	static get styles() {
		return [bodyStandardStyles, css`

			#file-details-container {
				display: flex;
				justify-content: center;
				align-items: center;
				border: 2px dashed var(--d2l-color-corundum);
				padding: 20px 20px 15px 20px;
			}

			#upload-successful-body {
				display: flex;
				justify-content: center;
				text-align: center;
				margin-top: 20px;

			}
			#settings-options {
				display: flex;
				flex-direction: column;
				padding-top: 15px;
				padding-bottom: 15px;
			}

			#default-settings-label {
				padding-bottom: 20px;
			}

			.failed-files-info {
				font-size: 14px;
				margin-bottom: 0px;
			}

			.failed-files-list {
				height: calc(100% - 50px); // 50px from button group
				word-wrap: break-word;
				overflow-wrap: break-word;
			}

			.failed-file {
				margin: 0px;
			}

			.failed-file-name {
				color: red;
			}

			.failed-file-message {
				margin-left: 20px;
			}
		`];
	}

	async connectedCallback() {
		super.connectedCallback();
		this.failedFiles = this.totalFiles - this.completedFiles;
		this.successfulBodyHide = this.failedFiles > 0;
	}

	render() {
		return html`
			<div id="file-details-container">
				<p class="d2l-body-standard">${this.completedFiles === this.totalFiles ? this.localize('uploadBulkFinished', { totalFiles: this.totalFiles }) : this.localize('uploadBulkFinishedWithErrors', { totalFiles: this.totalFiles, completedFiles: this.completedFiles })}</p>
			</div>
			${this.successfulBodyHide ? html`
				<div class="upload-failed-body">
					<p class="failed-files-info">${this.failedFiles > 1 ? this.localize('failedUploads', { failedFiles: this.failedFiles }) : this.localize('failedUpload')}</p>
					<div class="failed-file-list">
						${Object.keys(this.bulkErrorMessages).map(file => html`<div class="failed-file"><p class="failed-file-name">${file}</p><p class="failed-file-message">${this.bulkErrorMessages[file]}</p></div>`)}
					</div>
					${this.failedFiles === this.totalFiles ? html`
						<d2l-button
							description=${this.localize('back')}
							@click=${this.onBack}>
							${this.localize('back')}
						</d2l-button>
					`
		: html`
						<d2l-button
							description=${this.localize('continue')}
							@click=${this.onContinue}>
							${this.localize('continue')}
						</d2l-button>
					`
}
				</div>
			`
		: html`
				<div id="upload-successful-body">
					<div id="settings-options">
						<d2l-button
							primary
							description=${this.localize('bulkDefaultProperties')}
							@click=${this.onDefaultProperties}>
							${this.localize('bulkDefaultProperties')}
						</d2l-button>
						<div id="default-settings-label">
							${this.localize('bulkDefaultPropertiesLabel')}
						</div>
						<d2l-button
							description=${this.localize('bulkEditProperties')}
							@click=${this.onEditProperties}>
							${this.localize('bulkEditProperties')}
						</d2l-button>
					</div>
				</div>
			`
}
		`;
	}

	onBack() {
		this.dispatchEvent(new CustomEvent('upload-view'));
	}

	onContinue() {
		this.successfulBodyHide = false;
	}

	onDefaultProperties() {
		this.dispatchEvent(new CustomEvent('default-properties'));
	}

	onEditProperties() {
		this.dispatchEvent(new CustomEvent('edit-properties'));
	}
}

customElements.define('d2l-content-uploader-bulk-complete', BulkComplete);
