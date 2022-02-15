import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui-labs/file-uploader/d2l-file-uploader.js';
import { heading3Styles, bodySmallStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';

class CaptionsUpload extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			uncaptionedLanguages: { type: Array },
			_selectedLanguage: { type: String }
		};
	}

	static get styles() {
		return [heading3Styles, bodySmallStyles, selectStyles, css`
			:host {
				display: block;
			}

			:host([hidden]) {
				display: none;
			}

			h3 {
				margin-bottom: 15px !important;
			}

			.captions-add-file-container {
				align-items: stretch;
				display: flex;
				flex-direction: column;
				margin-top: 10px;
			}

			.captions-add-language-selector-container {
				margin-top: 20px;
			}

			.captions-add-language-selector {
				width: 100%;
			}

			.captions-file-drop-container {
				margin: 20px auto;
			}

			.captions-file-drop-container[hidden] {
				display: none;
			}
		`];
	}

	constructor() {
		super();
		this.selectALanguageOptionValue = 'selectALanguage';
		this._selectedLanguage = this.selectALanguageOptionValue;
	}

	firstUpdated() {
		super.firstUpdated();
		const fileUploader = this.shadowRoot.querySelector('#file-uploader');
		if (fileUploader) {
			fileUploader.addEventListener('d2l-file-uploader-files-added', this._onFilesAdded.bind(this));
		}
		document.addEventListener('dragover', this._onDocumentDrag);
	}

	render() {
		return html`
			<div class="captions-add-file-container">
				<h3 class="d2l-heading-3">${this.localize('addCaptions')}</h3>
				<p class="d2l-body-small">${this.localize('supportedTypesAndRenameConvention')}</p>
				<div class="captions-add-language-selector-container">
					<select
						id="captions-add-language-selector"
						class="d2l-input-select captions-add-language-selector"
						@change=${this._onSelectedLanguageChange}
						value=${this._selectedLanguage}
						aria-label=${this.localize('selectLanguageForNewCaptions')}
						aria-haspopup="true">
							<option value=${this.selectALanguageOptionValue}>${this.localize('selectALanguage')}</option>
							${this.uncaptionedLanguages.map((language) => this._renderLanguageOptions(language))}
					</select>
				</div>
				<div class="captions-file-drop-container" ?hidden="${this._selectedLanguage === this.selectALanguageOptionValue}">
					<d2l-labs-file-uploader
						id="file-uploader"
						label=${this.localize('browseForCaptionsFile')}>
					</d2l-labs-file-uploader>
				</div>
			</div>
		`;
	}

	resetSelection() {
		const languageSelectElement = this.shadowRoot && this.shadowRoot.querySelector('#captions-add-language-selector');
		if (languageSelectElement) {
			languageSelectElement.value = this.selectALanguageOptionValue;
		}
		this._selectedLanguage = this.selectALanguageOptionValue;
	}

	get _isRtl() {
		return document.querySelector('[dir=rtl]');
	}

	_onDocumentDrag(event) {
		// block react dnd from getting these events
		event.stopPropagation();
	}

	_onFilesAdded(event) {
		if (event && event.detail && event.detail.files && event.detail.files.length > 0) {
			const [ file ] = event.detail.files;
			this.dispatchEvent(new CustomEvent('captions-upload-file-uploaded', {
				bubbles: true,
				composed: true,
				detail: {
					file,
					selectedLanguage: this._selectedLanguage
				}
			}));
		}
	}

	async _onSelectedLanguageChange(event) {
		if (event && event.target && event.target.value) {
			this._selectedLanguage = event.target.value;
		}
		this.requestUpdate();
		await this.updateComplete;

		// Prevent page from jumping up when the file dropper is un-hidden.
		if (this._selectedLanguage) {
			const fileUploader = this.shadowRoot.querySelector('#file-uploader');
			if (fileUploader) {
				fileUploader.scrollIntoView();
			}
		}
	}

	_renderLanguageOptions(language) {
		let optionText;
		if (this._isRtl) {
			optionText = `${language.code.toUpperCase()} — ${language.name}`;
		} else {
			optionText = `${language.name} — ${language.code.toUpperCase()}`;
		}
		return html`
			<option
				key=${language.code}
				value=${language.code}>
				${optionText}
			</option>
		`;
	}
}

customElements.define('captions-upload', CaptionsUpload);
