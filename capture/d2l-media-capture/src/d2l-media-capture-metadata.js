import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui/core/components/inputs/input-textarea.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';

import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin';
import { BrightspaceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';

class D2LMediaCaptureMetadata extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			isAudio: { type: Boolean, attribute: 'is-audio' },
			isVideoNote: { type: Boolean, attribute: 'is-video-note' },
			_autoGenerateCaptionsDisabled: { type: Boolean, attribute: false },
			_languages: { type: Array, attribute: false },
			_selectedLanguageCode: { type: String, attribute: false }
		};
	}

	static get styles() {
		return [selectStyles, css`
			.d2l-media-metadata-help-message {
				padding: 8px 0 12px 2px;
			}

			.d2l-metadata-table-label-column {
				padding-right: 15px;
			}

			.d2l-metadata-language-select {
				width: 100%;
			}

			.d2l-metadata-captions-checkbox {
				margin: 6px 0 0;
			}

			.d2l-metadata-captions-not-available {
				font-size: 14px;
				color: #AAAAAA;
				padding-left: 34px;
			}
		`];
	}

	constructor() {
		super();
		this._autoGenerateCaptionsDisabled = true;
		this._languages = [];
	}

	async connectedCallback() {
		super.connectedCallback();

		this.brightspaceClient = new BrightspaceApiClient({
			httpClient: new ContentServiceBrowserHttpClient()
		});
		await this._setupLanguages();
	}

	render() {
		return html`
			<div class="d2l-media-metadata-container">
				${this.isVideoNote ? html`
					<div class="d2l-media-metadata-help-message">
						${this.localize(this.isAudio ? 'audioNoteDescription' : 'videoNoteDescription')}
					</div>
				` : ''}
				<table>
					<tbody>
						<tr>
							<td class="d2l-metadata-table-label-column">
								<label id="metadata-title-label">${this.localize('title')}</label>
							</td>
							<td>
								<d2l-input-text
									id="title-field"
									labelled-by="metadata-title-label"
								>
								</d2l-input-text>
							</td>
						</tr>
						<tr>
							<td class="d2l-metadata-table-label-column">
								<label id="metadata-description-label">${this.localize('description')}</label>
							</td>
							<td>
								<d2l-input-textarea
									id="description-field"
									labelled-by="metadata-description-label"
									max-rows="5"
								>
								</d2l-input-textarea>
							</td>
						</tr>
						<tr>
							<td class="d2l-metadata-table-label-column">
								<label id="metadata-source-language-label">
									${this.localize('audioLanguage')}
								</label>
							</td>
							<td>
								<select
									id="language-select"
									class="d2l-input-select d2l-metadata-language-select"
									labelled-by="metadata-source-language-label"
									@change="${this._handleLanguageSelect}"
								>
									<option value="">${this.localize('unknown')}</option>
									${this._languages.map(language => html`
										<option value="${language.code}">${language.name}</option>
									`)}
								</select>
							</td>
						</tr>
						<tr>
							<td></td>
							<td>
								<d2l-input-checkbox
									id="auto-generate-captions-checkbox"
									class="d2l-metadata-captions-checkbox"
									name="Use automatic captioning"
									?disabled="${this._autoGenerateCaptionsDisabled}"
								>
									${this.localize('autoGenerateCaptionsFromAudio')}
								</d2l-input-checkbox>
								<div id="captions-not-available" class="d2l-metadata-captions-not-available">
									${this.localize('autoGenerateNotAvailable')}
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		`;
	}

	get ready() {
		return true;
	}

	get values() {
		return {
			title: this.shadowRoot.querySelector('#title-field').value,
			description: this.shadowRoot.querySelector('#description-field').value,
			sourceLanguage: this._selectedLanguage,
			autoCaptions: this.shadowRoot.querySelector('#auto-generate-captions-checkbox').checked
		};
	}

	_handleLanguageSelect(e) {
		if (this._languages.length > 0) {
			const { selectedIndex, value } = e.target;
			this._autoGenerateCaptionsDisabled = selectedIndex === 0 || !this._languages.at(selectedIndex - 1).autoCaptions;
			this._selectedLanguage = value;
			this.shadowRoot.querySelector('#captions-not-available').style.display = this._autoGenerateCaptionsDisabled ? 'inherit' : 'none';
		}
	}

	async _setupLanguages() {
		const Items = await this.brightspaceClient.getLocales();
		this._languages = Items.map(({ LocaleName, CultureCode, IsDefault, AutoCaptions }) => {
			const code = CultureCode.toLowerCase();
			return { name: LocaleName, code, isDefault: IsDefault, autoCaptions: AutoCaptions };
		});
		this.requestUpdate();
	}

}

customElements.define('d2l-media-capture-metadata', D2LMediaCaptureMetadata);
