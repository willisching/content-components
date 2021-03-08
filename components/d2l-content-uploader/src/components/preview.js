import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import { css, html, LitElement } from 'lit-element';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { formatFileSize } from '@brightspace-ui/intl/lib/fileSize.js';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin';

export default class extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
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
				overflow-wrap: break-word;
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
		const fileSize = this._fileSize ? ` (${formatFileSize(this.fileSize)})` : '';
		const icon = this.fileType.startsWith('audio') ? 'tier1:file-audio' : 'tier1:file-video';

		return html`
			<div id="container">
				<div id="staged-file-wrapper">
					<div id="staged-file">
						<d2l-icon icon="${icon}"></d2l-icon>
						<p id="file-details" class="d2l-body-compact">${this.fileName}${fileSize}</p>
						<d2l-button-icon
							id="change-file-button"
							aria-expanded="false"
							aria-haspopup="false"
							aria-label=${this.localize('changeFile')}
							text="${this.localize('remove')} ${this.fileName}"
							icon="tier1:close-default"
							@click=${this.onChangeFileClick}>
						</d2l-button-icon>
					</div>
				</div>
			</div>
		`;
	}

	onChangeFileClick() {
		this.dispatchEvent(new CustomEvent('cancel', {
			bubbles: true,
			composed: true
		}));
	}
}

