import { css, html, LitElement } from 'lit-element/lit-element.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/dialog/dialog.js';
import './d2l-producer-language-selector.js';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';

class AutoGenerateCaptionsDialog extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			languages: { type: Array },
			opened: { type: Boolean },
			selectedLanguage: { type: Object },
		};
	}

	static get styles() {
		return [ bodyCompactStyles, css`
			.d2l-producer-auto-generate-dialog-content {
				padding-bottom: 20px;
			}

			.d2l-producer-publish-warning {
				font-weight: bold;
			}
		`];
	}

	constructor() {
		super();
		this.languages = [];
		this.selectedLanguage = { name: '', code: '' };
	}

	render() {
		return html`
			<d2l-dialog
				.opened="${this.opened}"
				title-text="${this.localize('autoGenerateCaptions')}"
			>
				<div class="d2l-producer-auto-generate-dialog-content">
					<p class="d2l-body-compact">${this.localize('autoGenerateDescription')}</p>
					<p class="d2l-body-compact d2l-producer-publish-warning">${this.localize('publishWarning')}</p>
				</div>
				<d2l-button
					@click="${this._handleAutoGenerateClick}"
					data-dialog-action="Done"
					primary
					slot="footer"
				>${this.localize('autoGenerate')}</d2l-button>
				<d2l-button
					data-dialog-action
					slot="footer"
				>${this.localize('cancel')}</d2l-button>
			</d2l-dialog>
		`;
	}

	_handleAutoGenerateClick() {
		this.dispatchEvent(new CustomEvent('captions-auto-generation-started', {
			detail: { language: this.selectedLanguage },
			bubbles: true,
			composed: true,
		}));
	}

	_handleDialogClosed() {
		this.dispatchEvent(new CustomEvent('auto-generate-dialog-closed'));
	}
}
customElements.define('d2l-producer-auto-generate-captions-dialog', AutoGenerateCaptionsDialog);
