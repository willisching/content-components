import '@brightspace-ui/core/components/meter/meter-linear.js';
import { css, html, LitElement } from 'lit-element';
import { bodyStandardStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';

export class Progress extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			fileName: { type: String, attribute: 'file-name', reflect: true },
			uploadProgress: { type: Number, attribute: 'upload-progress', reflect: true },
			totalFiles: { type: Number, attribute: 'total-files' },
			completedFiles: { type: Number, attribute: 'completed-files' },
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
			#progress-container {
				margin-top: 15px;
				padding-bottom: 10px;
			}
		`];
	}

	render() {
		return html`
			<div id="file-details-container">
				<p class="d2l-body-standard">${this.totalFiles > 1 ? this.localize('uploadBulkProgress', { completedFiles: this.completedFiles, totalFiles: this.totalFiles }) : this.fileName}</p>
			</div>
			<div id="progress-container">
				<d2l-meter-linear
					percent
					text="${this.localize('uploading')}  {%}"
					value=${this.uploadProgress}
					max="100"></d2l-meter-linear>
			</div>
		`;
	}
}

customElements.define('d2l-upload-progress', Progress);
