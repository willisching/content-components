import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import { css, html, LitElement } from 'lit-element';
import { bodyStandardStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { RevisionLoaderMixin } from '../mixins/revision-loader-mixin.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';

export class BulkComplete extends RevisionLoaderMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			fileName: { type: String, attribute: 'file-name', reflect: true },
			totalFiles: { type: Number, attribute: 'total-files' },
			completedFiles: { type: Number, attribute: 'completed-files' },
			bulkErrorMessages: { type: Object },
			hasFailures: { type: Boolean, attribute: 'has-failures' },

			_failedFiles: { type: Number, attribute: false },
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
				font-size: 14px;
			}

			.failed-files-info {
				font-size: 14px;
				margin-bottom: 0px;
			}

			.failed-files-list {
				height: calc(100% - 50px); /* 50px from button group */
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
		this._failedFiles = this.totalFiles - this.completedFiles;
	}

	render() {
		return html`
			<div id="file-details-container">
					<p class="d2l-body-standard">${this.completedFiles === this.totalFiles ? this.localize('uploadBulkFinished', { totalFiles: this.totalFiles }) : this.localize('uploadBulkFinishedWithErrors', { totalFiles: this.totalFiles, completedFiles: this.completedFiles })}</p>
				</div>
			${this.hasFailures ? this._renderFailures() : this._renderContinue()}
		`;
	}

	onDefaultProperties() {
		this.dispatchEvent(new CustomEvent('default-properties'));
	}

	onEditProperties() {
		this.dispatchEvent(new CustomEvent('edit-properties'));
	}

	_renderContinue() {
		return html`
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
		`;
	}

	_renderFailures() {
		return html`
			<div class="upload-failed-body">
				<p class="failed-files-info">${this._failedFiles > 1 ? this.localize('failedUploads', { _failedFiles: this._failedFiles }) : this.localize('failedUpload')}</p>
				<div class="failed-file-list">
					${Object.keys(this.bulkErrorMessages).map(file => html`<div class="failed-file"><p class="failed-file-name">${file}</p><p class="failed-file-message">${this.bulkErrorMessages[file]}</p></div>`)}
				</div>
			</div>
		`;
	}
}

customElements.define('d2l-bulk-complete', BulkComplete);
