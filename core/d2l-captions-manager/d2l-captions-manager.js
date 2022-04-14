import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import { labelStyles, heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { captionsLanguageCodesToNames } from './src/constants/captions-languages.js';
import { telemetryNames } from './src/constants/telemetry-names.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from './src/mixins/internal-localize-mixin.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import UserBrightspaceClient from './src/util/user-brightspace-client.js';
import './src/components/captions-list.js';
import './src/components/captions-upload.js';

class CaptionsManager extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			valenceHost: { type: String, attribute: 'valence-host' },
			orgUnitId: { type: String, attribute: 'org-unit-id' },
			topicId: { type: String, attribute: 'topic-id' },
			_loadingMessage: { type: String },
			_captionsList: { type: Array },
			_uncaptionedLanguages: { type: Array },
		};
	}

	static get styles() {
		return [labelStyles, heading2Styles, css`
			:host {
				display: block;
			}

			:host([hidden]) {
				display: none;
			}

			.captions-edit-container {
				border-bottom: 1px solid var(--d2l-color-gypsum);
				display: flex;
				flex-direction: column;
				margin-bottom: 20px;
				padding: 30px 0;
				width: 100%;
			}

			.captions-edit-container[hidden] {
				display: none;
			}

			.loading-container[hidden] {
				display: none;
			}

			h2 {
				margin-bottom: 15px !important;
			}

			.captions-separator-line {
				border: none;
				border-top: 1px solid var(--d2l-color-gypsum);
			}

			.captions-list-error-container {
				align-items: center;
				display: flex;
				flex-direction: column;
				justify-content: center;
				margin-top: 30px;
				width: 100%;
			}

			.captions-list-error-container p {
				text-align: center;
			}
			.captions-list-error-container d2l-icon {
				color: red;
			}

			.loading-indicator-container {
				align-items: center;
				display: flex;
				flex-direction: column;
				margin-top: 50px;
				width: 100%;
			}

			.loading-indicator-container * {
				display: block;
			}
		`];
	}

	constructor() {
		super();
		this.userBrightspaceClient = null;
		this._loadingMessage = this.localize('loading');
		this._captionsList = [];
		this._uncaptionedLanguages = [];
		this._captionsListFailedToLoad = false;

		Object.keys(captionsLanguageCodesToNames).forEach((languageCode) => {
			this._uncaptionedLanguages.push({
				code: languageCode,
				name: captionsLanguageCodesToNames[languageCode],
			});
		});
		this._uncaptionedLanguages = this._uncaptionedLanguages.sort(this._compareLanguages);
	}

	async firstUpdated() {
		super.firstUpdated();
		if (!this.userBrightspaceClient) {
			this.userBrightspaceClient = new UserBrightspaceClient(this.valenceHost);
		}

		await this._loadCaptionsList();
	}

	render() {
		if (this._captionsListFailedToLoad) {
			return this._renderCaptionsListError();
		}

		return html`
			<div class="loading-container" ?hidden="${!this._loadingMessage}">
				${this._renderLoading()}
			</div>
			<div class="captions-edit-container" ?hidden="${this._loadingMessage}">
				<h2 class="d2l-heading-2">${this.localize('manageCaptions')}</h2>
				<div>
					<captions-list
						.captionsList=${this._captionsList}
						@captions-list-captions-deleted=${this._deleteCaptionsHandler}>
					</captions-list>
					<div>
						<hr class="captions-separator-line"/>
					</div>
					<captions-upload
						id="captions-upload"
						.uncaptionedLanguages=${this._uncaptionedLanguages}
						@captions-upload-file-uploaded=${this._onFilesAdded}>
					</captions-upload>
				</div>
			</div>
		`;
	}

	emitEvent(eventName, detail = {}) {
		this.dispatchEvent(new CustomEvent(eventName, {
			bubbles: true,
			composed: true,
			detail
		}));
	}

	_captionsAreEqual(a, b) {
		return (
			this._getCombinedLanguageCodeAndCulture(a.LanguageCode, a.LanguageCulture).toLowerCase()
			=== this._getCombinedLanguageCodeAndCulture(b.LanguageCode, b.LanguageCulture).toLowerCase()
		);
	}

	_captionsMatchLanguage(captions, language) {
		return (
			language.code.toLowerCase()
			=== this._getCombinedLanguageCodeAndCulture(captions.LanguageCode, captions.LanguageCulture).toLowerCase()
		);
	}

	_compareCaptions(a, b) {
		return a.LanguageName.localeCompare(b.LanguageName);
	}

	_compareLanguages(a, b) {
		return a.name.localeCompare(b.name);
	}

	async _deleteCaptionsHandler(event) {
		if (event && event.detail && event.detail.deletedCaptions) {
			const deletedCaptions = event.detail.deletedCaptions;
			this._loadingMessage = this.localize('deletingFile', { filename: deletedCaptions.Filename });
			this.emitEvent('d2l-captions-manager-telemetry', { name: telemetryNames.deleteCaptions });

			try {
				await this.userBrightspaceClient.deleteCaptions(this.orgUnitId, this.topicId, this._getCombinedLanguageCodeAndCulture(deletedCaptions.LanguageCode, deletedCaptions.LanguageCulture));
				const newUncaptionedLanguage = {
					code: this._getCombinedLanguageCodeAndCulture(deletedCaptions.LanguageCode, deletedCaptions.LanguageCulture),
					name: deletedCaptions.LanguageName,
				};
				this._captionsList = (this._captionsList.filter(captions => (!this._captionsAreEqual(captions, deletedCaptions)))).sort(this._compareCaptions);
				const updatedUncaptionedLanguages = [ ...this._uncaptionedLanguages, newUncaptionedLanguage ];
				this._uncaptionedLanguages = updatedUncaptionedLanguages.sort(this._compareLanguages);
				this.emitEvent('d2l-captions-manager-captions-changed');
			} catch (error) {
				this.emitEvent('d2l-captions-manager-telemetry', { name: telemetryNames.deleteCaptionsError, error });
				this.emitEvent('d2l-captions-manager-error-deleting');
			} finally {
				this._loadingMessage = '';
			}
		}
	}

	_getCombinedLanguageCodeAndCulture(code, culture) {
		return code + (culture ? `-${culture}` : '');
	}

	async _loadCaptionsList() {
		this._loadingMessage = this.localize('loading');

		try {
			const getCaptionsResponse = await this.userBrightspaceClient.getCaptions(this.orgUnitId, this.topicId, Object.keys(captionsLanguageCodesToNames).length);
			this._captionsList = getCaptionsResponse.body.Objects.sort(this._compareCaptions);

			// Filter the list of uncaptioned languages to remove any languages
			// that appear in the loaded list of captions.
			this._uncaptionedLanguages = this._uncaptionedLanguages.filter((language) => (
				!this._captionsList.some(
					captions => this._captionsMatchLanguage(captions, language),
				)
			));
			this._captionsListFailedToLoad = false;
		} catch (error) {
			this.emitEvent('d2l-captions-manager-telemetry', { name: telemetryNames.getCaptionsListFail });
			this._captionsListFailedToLoad = true;
		} finally {
			this._loadingMessage = '';
		}
	}

	async _onFilesAdded(event) {
		if (event && event.detail && event.detail.file && event.detail.selectedLanguage) {
			const file = event.detail.file;
			const extension = file.name.split('.').pop();
			if (!['srt', 'vtt'].includes(extension.toLowerCase())) {
				this.emitEvent('d2l-captions-manager-telemetry', { name: telemetryNames.uploadInvalidFile });
				this.emitEvent('d2l-captions-manager-invalid-file-type');
			} else {
				await this._uploadCaptionsFile(file, event.detail.selectedLanguage);
			}
		}
	}

	async _onReloadCaptionsListClick() {
		this.emitEvent('d2l-captions-manage-telemetry', { name: telemetryNames.reloadCaptionsList });
		return this._loadCaptionsList();
	}

	_renderCaptionsListError() {
		return html`
			<div class="captions-list-error-container">
				<d2l-icon icon='tier3:alert'></d2l-icon>
				<p>
					${this.localize('failedToLoadCaptions')}
					<br />
					<d2l-link
						@click=${this._onReloadCaptionsListClick}>
						${this.localize('clickHereToReload')}
					</d2l-link>
				</p>
			</div>
		`;
	}

	_renderLoading() {
		return html`
			<div class="loading-indicator-container">
				<d2l-loading-spinner size='100'></d2l-loading-spinner>
				<p class="d2l-label-text">${this._loadingMessage}</p>
			</div>
		`;
	}

	async _uploadCaptionsFile(file, selectedLanguage) {
		this.emitEvent('d2l-captions-manager-telemetry', { name: telemetryNames.uploadFile });
		this._loadingMessage = this.localize('uploadingFile', { filename: file.name});

		try {
			const captionsUploadElement = this.shadowRoot.querySelector('#captions-upload');
			const uploadCaptionsResponse = await this.userBrightspaceClient.uploadCaptionsFile(this.orgUnitId, this.topicId, selectedLanguage, file);
			const uploadedCaptionsMetadata = uploadCaptionsResponse.body;
			const updatedCaptionsList = [ ...this._captionsList, uploadedCaptionsMetadata ];

			this._captionsList = updatedCaptionsList.sort(this._compareCaptions);
			this._uncaptionedLanguages = this._uncaptionedLanguages.filter(language => (
				!this._captionsMatchLanguage(uploadedCaptionsMetadata, language)
			));
			this.emitEvent('d2l-captions-manager-captions-changed');
			if (captionsUploadElement) {
				captionsUploadElement.resetSelection();
			}
		} catch (error) {
			this.emitEvent('d2l-captions-manager-telemetry', { name: telemetryNames.uploadFileError, error });
			this.emitEvent('d2l-captions-manager-error-uploading');
		} finally {
			this._loadingMessage = '';
		}
	}
}
customElements.define('d2l-captions-manager', CaptionsManager);
