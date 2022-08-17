import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui/core/components/inputs/input-textarea.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';

import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../../mixins/internal-localize-mixin';
import { BrightspaceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';

class D2LMediaCaptureMetadata extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			isAudio: { type: Boolean, attribute: 'is-audio' },
			isVideoNote: { type: Boolean, attribute: 'is-video-note' },
			autoCaptionsEnabled: { type: Boolean, attribute: 'auto-captions-enabled' },
			_canAutoCaptionForLocale: { type: Boolean, attribute: false },
			_locales: { type: Array, attribute: false },
			_selectedLocaleCode: { type: String, attribute: false }
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

			.d2l-metadata-table-input-column {
				width: 350px;
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
		this._locales = [];
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
					</div>` : ''}
				<table>
					<tbody>
						<tr>
							<td class="d2l-metadata-table-label-column">
								<label id="metadata-title-label">${this.localize('title')}</label>
							</td>
							<td class="d2l-metadata-table-input-column">
								<d2l-input-text
									id="title-field"
									labelled-by="metadata-title-label"
									?required=${!this.isVideoNote}
									@input=${this._handleTitleInputChange}
								>
								</d2l-input-text>
							</td>
						</tr>
						<tr>
							<td class="d2l-metadata-table-label-column">
								<label id="metadata-description-label">${this.localize('description')}</label>
							</td>
							<td class="d2l-metadata-table-input-column">
								<d2l-input-textarea
									id="description-field"
									labelled-by="metadata-description-label"
									max-rows="5"
								>
								</d2l-input-textarea>
							</td>
						</tr>
						${this._renderCaptionsOptions()}
					</tbody>
				</table>
			</div>
		`;
	}

	get ready() {
		return this.isVideoNote || this._valid;
	}

	get values() {
		return {
			title: this.shadowRoot.getElementById('title-field').value,
			description: this.shadowRoot.getElementById('description-field').value,
			sourceLanguage: this._selectedLanguage,
			autoCaptions: this.autoCaptionsEnabled && this.shadowRoot.getElementById('auto-generate-captions-checkbox').checked
		};
	}

	_handleLanguageSelect(event) {
		if (this._locales.length > 0) {
			const { selectedIndex, value } = event.target;
			this._canAutoCaptionForLocale = selectedIndex !== 0 && this._locales.at(selectedIndex - 1).autoCaptions;
			this._selectedLanguage = value;
		}
	}

	_handleTitleInputChange(event) {
		if (!this.isVideoNote) {
			const titleInputValue = event.target.value;
			this._valid = titleInputValue && titleInputValue.trim().length > 0;
			this.dispatchEvent(new CustomEvent('metadata-input', {
				bubbles: true,
				composed: true,
				detail: {
					valid: this._valid
				}
			}));
		}
	}

	_renderCaptionsOptions() {
		if (this.autoCaptionsEnabled) {
			return html`
				<tr>
					<td class="d2l-metadata-table-label-column">
						<label id="metadata-source-language-label">
							${this.localize('audioLanguage')}
						</label>
					</td>
					<td class="d2l-metadata-table-input-column">
						<select
							id="language-select"
							class="d2l-input-select d2l-metadata-language-select"
							labelled-by="metadata-source-language-label"
							@change="${this._handleLanguageSelect}"
						>
							<option value="">${this.localize('unknown')}</option>
							${this._locales.map(language => html`<option value="${language.code}">${language.name}</option>`)}
						</select>
					</td>
				</tr>
				<tr>
					<td></td>
					<td class="d2l-metadata-table-input-column">
						<d2l-input-checkbox
							id="auto-generate-captions-checkbox"
							class="d2l-metadata-captions-checkbox"
							name="Use automatic captioning"
							?disabled="${!this._canAutoCaptionForLocale}"
						>
							${this.localize('autoGenerateCaptionsFromAudio')}
						</d2l-input-checkbox>
						${!this._canAutoCaptionForLocale ? html`
							<div id="captions-not-available" class="d2l-metadata-captions-not-available">
								${this.localize('autoGenerateNotAvailable')}
							</div>` : ''}
					</td>
				</tr>
			`;
		}
	}

	async _setupLanguages() {
		const Items = await this.brightspaceClient.getLocales();
		this._locales = Items.map(({ LocaleName, CultureCode, IsDefault, AutoCaptions }) => {
			const code = CultureCode.toLowerCase();
			return { name: LocaleName, code, isDefault: IsDefault, autoCaptions: AutoCaptions };
		});
	}
}

customElements.define('d2l-media-capture-metadata', D2LMediaCaptureMetadata);
