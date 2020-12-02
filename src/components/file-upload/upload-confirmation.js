import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import { css, html, LitElement } from 'lit-element';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { formatFileSize } from '@brightspace-ui/intl/lib/fileSize.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin';

class UploadConfirmation extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			contentTitle: { type: String, attribute: 'content-title', reflect: true },
			fileName: { type: String, attribute: 'file-name', reflect: true },
			fileSize: { type: String, attribute: 'file-size', reflect: true },
			fileType: { type: String, attribute: 'file-type', reflect: true }
		};
	}

	static get styles() {
		return [bodyCompactStyles, css`
			#container {
				display: flex;
				flex-direction: column;
				align-items: center;
			}
			#content-title {
				padding-top: 10px;
			}
			#staged-file-wrapper {
				margin-top: 30px;
				width: 100%;
			}
			#staged-file {
				display: table;
				margin: 0 auto;
			}
			#staged-file > * {
				margin: 3px;
				display: inline-block;
			}
			#file-details {
				font-weight: 600;
				word-break: break-word;
				overflow-break: break-word;
			}
		`];
	}

	constructor() {
		super();
		this.contentTitle = '';
		this.fileName = '';
		this.fileSize = 0;
		this.fileType = '';
	}

	render() {
		return html`
			<div id="container">
				<d2l-input-text
					id="content-title"
					aria-haspopup="false"
					aria-invalid=${this.contentTitle === '' ? 'true' : 'false'}
					title=${this.localize('titleForUpload')}
					label="${this.localize('title')}"
					required
					value=${this.contentTitle}
					@input=${this.onContentTitleInput}
					></d2l-input-text>
				<div id="staged-file-wrapper">
					<div id="staged-file">
						<d2l-icon icon="${this.fileType.startsWith('audio') ? 'tier1:file-audio' : 'tier1:file-video'}"></d2l-icon>
						<p
							id="file-details"
							class="d2l-body-compact"
							>${this.fileName} (${formatFileSize(this.fileSize)})</p>
						<d2l-button-icon
							id="change-file-button"
							aria-expanded="false"
							aria-haspopup="false"
							aria-label=${this.localize('changeFile')}
							text="${this.localize('remove')} ${this.fileName}"
							icon="tier1:close-default"
							@click=${this.onChangeFileClick}></d2l-button-icon>
					</div>
				</div>
			</div>
		`;
	}

	onChangeFileClick() {
		this.dispatchEvent(new CustomEvent('discard-staged-file', {
			bubbles: true,
			composed: true
		}));
	}

	onContentTitleInput(event) {
		this.dispatchEvent(new CustomEvent('change-content-title', {
			detail: {
				contentTitle: event.target.value
			},
			bubbles: true,
			composed: true
		}));
	}
}

window.customElements.define('upload-confirmation', UploadConfirmation);
