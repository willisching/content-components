import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/dialog/dialog-confirm.js';
import '@brightspace-ui/core/components/dropdown/dropdown-button-subtle.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import './src/d2l-video-producer-language-selector.js';
import './d2l-capture-producer-editor.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import { autorun } from 'mobx';
import ContentServiceClient from './src/content-service-client.js';
import { InternalLocalizeMixin } from './src/internal-localize-mixin.js';
import { labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import UserBrightspaceClient from './src/user-brightspace-client.js';
import { convertTextTrackCueListToVttText } from './src/captions-utils.js';

class CaptureProducer extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			contentId: { type: String, attribute: 'content-id' },
			endpoint: { type: String },
			tenantId: { type: String, attribute: 'tenant-id' },

			_alertMessage: { type: String, attribute: false },
			_captions: { type: Array, attribute: false },
			_captionsUrl: { type: String, attribute: false },
			_captionsLoading: { type: Boolean, attribute: false },
			_content: { type: String, attribute: false },
			_defaultLanguage: { type: Object, attribute: false },
			_errorOccurred: { type: Boolean, attribute: false },
			_finishing: { type: Boolean, attribute: false },
			_loading: { type: Boolean, attribute: false },
			_metadata: { type: Object, attribute: false },
			_metadataLoading: { type: Boolean, attribute: false },
			_revisionIndexToLoad: { type: Number, attribute: false },
			_revisionsLatestToOldest: { type: Object, attribute: false },
			_saving: { type: Boolean, attribute: false },
			_selectedLanguage: { type: Object, attribute: false },
			_src: { type: String, attribute: false },
			_unsavedChanges: { type: String, attribute: false },
			_mediaLoaded: { type: Boolean, attribute: false },
		};
	}

	static get styles() {
		return [labelStyles, selectStyles, css`
			.d2l-video-producer-loading-container {
				align-items: center;
				display: flex;
				height: 70%;
				justify-content: center;
				overflow-y: hidden;
				position: absolute;
				width: 100%;
				z-index: 99;
			}

			.d2l-video-producer-top-bar-controls {
				align-items: center;
				display: flex;
				justify-content: flex-end;
				margin-bottom: 15px;
			}

			d2l-video-producer-language-selector {
				margin-right: auto;
			}

			.d2l-video-producer-saved-unsaved-indicator-container {
				align-items: center;
				display: flex;
				flex-direction: row;
				margin-right: 15px;
			}

			.d2l-video-producer-saved-unsaved-indicator-icon {
				margin-left: 5px;
			}

			.d2l-video-producer-controls-revision-dropdown {
				margin-right: 10px;
			}

			.d2l-video-producer-controls-publish-button {
				margin-left: 10px;
			}

			.d2l-video-producer-controls-publish-button .d2l-video-producer-controls-publishing {
				display: flex;
				align-items: center;
			}

			.d2l-video-producer-controls-publish-button d2l-loading-spinner {
				margin-right: 5px;
			}
		`];
	}

	static get content() {
		return this._content;
	}

	constructor() {
		super();

		this._revisionIndexToLoad = 0;
		this._unsavedChanges = false;

		this._alertMessage = '';
		this._errorOccurred = false;

		this._captions = [];
		this._captionsUrl = '';
		this._captionsLoading = true;

		this._metadata = { cuts: [], chapters: [] };
		this._metadataLoading = true;
		this._src = '';
		this._defaultLanguage = {};
		this._selectedLanguage = {};
		this._mediaLoaded = false;
	}

	async connectedCallback() {
		super.connectedCallback();

		this.apiClient = new ContentServiceClient({
			endpoint: this.endpoint,
			tenantId: this.tenantId
		});
		this.userBrightspaceClient = new UserBrightspaceClient();

		autorun(async() => {
			this._content = await this.apiClient.getContent(this.contentId);
			this._fireContentLoadedEvent(this._content);
			if (this._content?.revisions) {
				this._revisionsLatestToOldest = this._content.revisions.slice().reverse();
			}
			this._src = (await this.apiClient.getSignedUrl(this.contentId)).value;
			await this._setupLanguages();
			this._loadMetadata('latest');
			this._loadCaptions('latest', this._selectedLanguage.code);
		});
	}

	render() {
		return html`
			<div class="d2l-video-producer">
				${this._loading ? html`<div class="d2l-video-producer-loading-container"><d2l-loading-spinner size=150></d2l-loading-spinner></div>` : ''}
				<div class="d2l-video-producer-top-bar-controls" style="visibility: ${this._loading ? 'hidden' : 'visible'};">
					<d2l-video-producer-language-selector
						?disabled="${this._saving || this._finishing}"
						.languages="${this._languages}"
						.selectedLanguage="${this._selectedLanguage}"
						@selected-language-changed="${this._handleSelectedLanguageChanged}"
					></d2l-video-producer-language-selector>
					${this._renderSavedUnsavedIndicator()}
					<d2l-dropdown-button-subtle
						class="d2l-video-producer-controls-revision-dropdown"
						?disabled="${this._saving || this._finishing}"
						text="${this.localize('copyFromPastRevision')}"
					>
						<d2l-dropdown-menu
							@d2l-menu-item-select="${this._handleSelectedRevisionChanged}"
						>
							<d2l-menu label="${this.localize('revisions')}">
								${this._renderRevisionsDropdownItems()}
							</d2l-menu>
						</d2l-dropdown-menu>
					</d2l-dropdown-button-subtle>
					<d2l-button
						class="d2l-video-producer-controls-save-button"
						@click="${this._handleSave}"
						?disabled="${this._saving || this._finishing || this._metadataLoading || this._captionsLoading}"
						text="${this.localize('saveDraft')}"
					>
						${this.localize('saveDraft')}
					</d2l-button>
					<d2l-button
						?disabled="${this._saving || this._finishing || this._metadataLoading || this._captionsLoading}"
						@click="${this._handleFinish}"
						class="d2l-video-producer-controls-publish-button"
						primary
					><div class="d2l-video-producer-controls-publishing" style="${!this._finishing ? 'display: none' : ''}">
							<d2l-loading-spinner size="20"></d2l-loading-spinner>
							${this.localize('finishing')}
						</div>
						<div ?hidden="${this._finishing}">
							${this.localize('finish')}
						</div>
					</d2l-button>
				</div>
				<d2l-capture-producer-editor
					.captions="${this._captions}"
					@captions-changed="${this._handleCaptionsChanged}"
					?captions-loading="${this._captionsLoading}"
					.captionsUrl="${this._captionsUrl}"
					@captions-url-changed="${this._handleCaptionsUrlChanged}"
					.defaultLanguage="${this._defaultLanguage}"
					@media-loaded="${this._handleMediaLoaded}"
					.metadata="${this._metadata}"
					@metadata-changed="${this._handleMetadataChanged}"
					?metadata-loading="${this._metadataLoading}"
					.selectedLanguage="${this._selectedLanguage}"
					.src="${this._src}"
					style="visibility: ${this._loading ? 'hidden' : 'visible'};"
				></d2l-capture-producer-editor>
				<d2l-alert-toast type="${this._errorOccurred ? 'error' : 'default'}">
					${this._alertMessage}
				</d2l-alert-toast>
				<d2l-dialog-confirm
					class="d2l-video-producer-dialog-confirm-copy-from-revision"
					text="${this.localize('confirmOverwriteFromPastRevision')}"
				>
					<d2l-button
						@click="${this._loadNewlySelectedRevision}"
						data-dialog-action="yes"
						slot="footer"
					>
						${this.localize('yes')}
					</d2l-button>
					<d2l-button
						data-dialog-action="no"
						primary
						slot="footer"
					>
						${this.localize('no')}
					</d2l-button>
				</d2l-dialog-confirm>
			</div>
		`;
	}

	_fireContentLoadedEvent(content) {
		this.dispatchEvent(new CustomEvent(
			'content-loaded',
			{
				composed: false,
				detail: { content }
			}
		));
	}

	_formatCaptionsSrcLang() {
		// Some of the 5-character language codes we receive from the D2L locales endpoint are all lowercase, e.g. "en-us".
		// We need to convert them to mixed case ("en-US") in order to match the spec for <track> element's "srclang" attribute.
		// If the format is incorrect, <track> will not process the captions into cue objects.
		if (this._selectedLanguage.code.length === 5) {
			return `${this._selectedLanguage.code.slice(0, 2)}-${this._selectedLanguage.code.slice(3).toUpperCase()}`;
		}
		return this._selectedLanguage.code;
	}

	_handleCaptionsChanged(event) {
		this._captions = event.detail.captions;
		if (!this._captionsLoading) {
			this._unsavedChanges = true;
		}
		this._captionsLoading = false;
	}

	_handleCaptionsUrlChanged(event) {
		this._captionsLoading = true;
		// Media Player's onSlotChange might not execute if the <track> slot's attributes change.
		// To force it to execute, we need to temporarily remove the slot and re-add it.
		// In D2LVideoProducerEditor.render(), we hide the <track> slot when captionsUrl is falsy.
		this._captionsUrl = '';
		setTimeout(() => {
			this._captionsUrl = event.detail.captionsUrl;
			this._unsavedChanges = true;
		}, 0);
	}

	_handleChaptersChanged(e) {
		this._metadata = { ...this._metadata, chapters: e.detail.chapters };
		this._unsavedChanges = true;
	}

	async _handleFinish() {
		this._finishing = true;

		await this.apiClient.updateMetadata({
			contentId: this._content.id,
			metadata: this._metadata,
			revisionId: 'latest',
		});
		await this.apiClient.updateCaptions({
			contentId: this._content.id,
			captionsVttText: convertTextTrackCueListToVttText(this._captions),
			revisionId: 'latest',
			locale: this._selectedLanguage.code
		});
		const { id, ...revision } = this._revisionsLatestToOldest[0];
		let newRevision;
		try {
			newRevision = await this.apiClient.createRevision({
				contentId: this._content.id,
				body: {
					title: this._content.name,
					extension: revision.extension,
					sourceFormat: 'hd',
					formats: ['ld'],
				},
				sourceRevisionId: id
			});
			await this.apiClient.processRevision({
				contentId: this._content.id,
				revisionId: newRevision.id,
				body: { sourceRevisionId: id }
			});
			this._revisionsLatestToOldest.unshift(newRevision);
			this._unsavedChanges = false;
		} catch (error) {
			if (newRevision) {
				await this.apiClient.deleteRevision({
					contentId: this._content.id, revisionId: newRevision.id
				});
			}
			this._errorOccurred = true;
		}
		this._alertMessage = this._errorOccurred
			? this.localize('finishError')
			: this.localize('finishSuccess');
		this.shadowRoot.querySelector('d2l-alert-toast').open = true;
		this._finishing = false;
	}

	_handleMediaLoaded() {
		this._mediaLoaded = true;
	}

	_handleMetadataChanged(event) {
		this._metadata = event.detail;
		if (!this._metadataLoading) {
			this._unsavedChanges = true;
		}
		this._metadataLoading = false;
	}

	async _handleSave() {
		this._saving = true;
		try {
			await this.apiClient.updateMetadata({
				contentId: this._content.id,
				draft: true,
				metadata: this._metadata,
				revisionId: 'latest',
			});
			await this.apiClient.updateCaptions({
				contentId: this._content.id,
				draft: true,
				captionsVttText: convertTextTrackCueListToVttText(this._captions),
				revisionId: 'latest',
				locale: this._selectedLanguage.code
			});
			this._unsavedChanges = false;
		} catch (error) {
			this._errorOccurred = true;
		}
		this._alertMessage = this._errorOccurred
			? this.localize('saveError')
			: this.localize('saveSuccess');
		this.shadowRoot.querySelector('d2l-alert-toast').open = true;
		this._saving = false;
	}

	_handleSelectedLanguageChanged(e) {
		this._selectedLanguage = e.detail.selectedLanguage;
	}

	async _handleSelectedRevisionChanged(e) {
		const newlySelectedRevisionIndex = Number.parseInt(e.target.dataset.revisionIndex);
		this._revisionIndexToLoad = newlySelectedRevisionIndex;
		if (this._unsavedChanges) {
			this.shadowRoot.querySelector('.d2l-video-producer-dialog-confirm-copy-from-revision').open();
		} else {
			this._loadNewlySelectedRevision();
		}
	}

	_handleTrackLoaded() {
		this._captions = this._video.textTracks[0].cues;
		this._captionsLoading = false;
	}

	async _loadCaptions(revision, locale) {
		this._captionsLoading = true;
		this._captionsUrl = '';
		try {
			const res = await this.apiClient.getCaptionsUrl({
				contentId: this._content.id,
				revisionId: revision,
				locale,
				draft: true,
			});
			this._captionsUrl = res.captionsUrl;
		} catch (error) {
			if (error.message === 'Not Found') {
				this._captions = [];
				this._captionsLoading = false;
			} else {
				const language = this._languages.find(lang => lang.code === locale);
				this._alertMessage = this.localize('loadCaptionsError', { language: language.name });
				this.shadowRoot.querySelector('d2l-alert-toast').open = true;
			}
		}
	}

	get _loading() {
		return !(
			this._mediaLoaded
			&& this._selectedLanguage
			&& this._selectedLanguage.code
		);
	}

	async _loadMetadata(revisionId) {
		this._metadataLoading = true;
		this._metadata = await this.apiClient.getMetadata({
			contentId: this._content.id,
			revisionId,
			draft: true
		});
		this._metadataLoading = false;
	}

	async _loadNewlySelectedRevision() {
		const revisionId = this._revisionsLatestToOldest[this._revisionIndexToLoad].id;
		this._loadMetadata(revisionId);
		this._loadCaptions(revisionId, this._selectedLanguage.code);
		this._unsavedChanges = true;
	}

	_renderRevisionsDropdownItems() {
		if (this._revisionsLatestToOldest) {
			return this._revisionsLatestToOldest.map((revision, index) => {
				let label;
				if (index === 0) {
					label = this.localize('currentDraft');
				} else {
					label = `${this.localize('revisionNumber', { number: this._revisionsLatestToOldest.length - index })}`;
				}
				return html`<d2l-menu-item data-revision-index="${index}" text="${label}"></d2l-menu-item>`;
			});
		} else {
			return '';
		}
	}

	_renderSavedUnsavedIndicator() {
		let feedbackColor = 'var(--d2l-color-feedback-success)';
		let icon = 'tier1:check-circle';
		let langterm = 'saved';
		if (this._unsavedChanges) {
			feedbackColor = 'var(--d2l-color-feedback-warning)';
			icon = 'tier1:alert';
			langterm = 'unsaved';
		}
		return html`
		  <div class="d2l-video-producer-saved-unsaved-indicator-container">
			<p class="d2l-label-text" style="color: ${feedbackColor};">
				${this.localize(langterm)}
			</p>
			<d2l-icon class="d2l-video-producer-saved-unsaved-indicator-icon" icon="${icon}" style="color: ${feedbackColor};"></d2l-icon>
		  </div>`;
	}

	async _setupLanguages() {
		const { Items } = await this.userBrightspaceClient.getLocales();
		this._languages = Items.map(({ LocaleName, CultureCode, IsDefault }) => {
			const code = CultureCode.toLowerCase();
			return { name: LocaleName, code, isDefault: IsDefault  };
		});
		this._selectedLanguage = this._languages.find(language => language.isDefault);
		this._defaultLanguage = this._selectedLanguage;
	}
}
customElements.define('d2l-capture-producer', CaptureProducer);
