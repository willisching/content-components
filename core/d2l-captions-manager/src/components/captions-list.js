import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/icons/icon.js';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';

class CaptionsList extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			captionsList: { type: Array }
		};
	}

	static get styles() {
		return [ bodyCompactStyles, css`
			:host {
				display: block;
			}

			:host([hidden]) {
				display: none;
			}

			.captions-list {
				display: flex;
				flex-direction: column;
				width: 100%;
			}

			.captions-list-item {
				align-items: center;
				display: flex;
				flex-direction: row;
				justify-content: flex-start;
			}

			.captions-list-item span {
				align-items: center;
				display: flex;
				flex-direction: row;
				flex: 1;
				margin-right: 5px;
			}
			:host([dir="rtl"]) .captions-list-item span {
				margin-left: 5px;
				margin-right: 0px;
			}

			.captions-list-item d2l-icon {
				flex-shrink: 0;
				margin-right: 5px;
			}
			:host([dir="rtl"]) .captions-list-item d2l-icon {
				margin-left: 5px;
				margin-right: 0px;
			}

			.captions-list-item p {
				overflow-wrap: break-word;
				word-break: break-word;
			}

			.captions-list-column-headers {
				font-weight: bold;
			}

			.empty-captions-list-container {
				align-items: center;
				display: flex;
				flex-direction: column;
				width: 90%;
			}

			.empty-captions-list-container p {
				text-align: center;
			}
		`];
	}

	render() {
		if (this.captionsList.length === 0) {
			return html`
				<div class="empty-captions-list-container">
					<p class="d2l-body-compact">
						${this.localize('noCaptionsForTopic')}<br/>
						${this.localize('useControlsToAddCaptions')}
					</p>
				</div>
			`;
		}

		return html`
			<div class="captions-list">
				<div class="captions-list-column-headers captions-list-item">
					<span><p>${this.localize('captionsLanguage')}</p></span>
					<span><p>${this.localize('captionsFile')}</p></span>
				</div>
				${this.captionsList.map(caption => this._renderCaption(caption))}
			</div>
		`;
	}

	_onDeleteCaptionsButtonClick(deletedCaptions) {
		this.dispatchEvent(new CustomEvent('captions-list-captions-deleted', {
			bubbles: true,
			composed: true,
			detail: { deletedCaptions }
		}));
	}

	_renderCaption(caption) {
		const languageCode = caption.LanguageCode + (caption.LanguageCulture ? `-${ caption.LanguageCulture}` : '');
		const buttonAccessibilityText = this.localize('removeCaptionsForLanguage', { langName: caption.LanguageName });
		const deleteCaptionsHandler = () => this._onDeleteCaptionsButtonClick(caption);

		return html`
			<div key=${caption.LanguageCode + (caption.LanguageCulture || '')} class="captions-list-item">
				<span><p>${caption.LanguageName} — <i>${languageCode}</i></p></span>
				<span>
					<d2l-icon icon='tier1:file-document'></d2l-icon>
					<p>${caption.Filename}</p>
					<d2l-button-icon
						icon='tier1:close-default'
						text=${buttonAccessibilityText}
						aria-label=${buttonAccessibilityText}
						@click=${deleteCaptionsHandler}>
					</d2l-button-icon>

				</span>
			</div>
		`;
	}
}

customElements.define('captions-list', CaptionsList);
