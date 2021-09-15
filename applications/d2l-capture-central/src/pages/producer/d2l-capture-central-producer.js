import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/dialog/dialog-confirm.js';
import '@brightspace-ui/core/components/dropdown/dropdown-button-subtle.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui-labs/video-producer/src/video-producer.js';
import '@brightspace-ui-labs/video-producer/src/video-producer-language-selector.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '../../../../../capture/d2l-capture-producer.js';

import { css, html } from 'lit-element/lit-element.js';
import { autorun } from 'mobx';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { pageNames } from '../../util/constants.js';
import { PageViewElement } from '../../components/page-view-element';

class D2LCaptureCentralProducer extends DependencyRequester(PageViewElement) {
	static get properties() {
		return {
			_alertMessage: { type: String, attribute: false },
			_content: { type: String, attribute: false },
			_defaultLanguage: { type: String, attribute: false },
			_errorOccurred: { type: Boolean, attribute: false },
			_finishing: { type: Boolean },
			_languages: { type: String, attribute: false },
			_loading: { type: Boolean, attribute: false },
			_metadata: { type: Object, attribute: false },
			_revisionIndexToLoad: { type: Number, attribute: false },
			_revisionsLatestToOldest: { type: Object, attribute: false },
			_saving: { type: Boolean },
			_selectedLanguage: { type: String, attribute: false },
			_selectedRevisionIndex: { type: Number, attribute: false },
			_sourceUrl: { type: String, attribute: false },
			_unsavedChanges: { type: String, attribute: false }
		};
	}

	static get styles() {
		return [navigationSharedStyle, css`
			.d2l-capture-central-producer {
				width: 1170px;
			}

			.d2l-capture-central-producer-controls {
				align-items: center;
				display: flex;
				justify-content: flex-end;
				margin-bottom: 15px;
			}

			d2l-labs-video-producer-language-selector {
				margin-right: auto;
			}

			.d2l-capture-central-producer-controls-revision-dropdown {
				margin-right: 10px;
			}

			.d2l-capture-central-producer-controls-publish-button {
				margin-left: 10px;
			}

			.d2l-capture-central-producer-controls-publish-button .d2l-capture-central-producer-controls-publishing {
				display: flex;
				align-items: center;
			}

			.d2l-capture-central-producer-controls-publish-button d2l-loading-spinner {
				margin-right: 5px;
			}

			d2l-loading-spinner {
				display: flex;
				margin: auto;
				margin-top: 200px;
			}
			d2l-breadcrumbs {
				margin: 25px 0;
			}
		`];
	}

	constructor() {
		super();
		this._alertMessage = '';
		this._errorOccurred = false;
		this._revisionIndexToLoad = 0;
		this._selectedRevisionIndex = 0;
		this._unsavedChanges = false;
	}

	async connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
		this.userBrightspaceClient = this.requestDependency('user-brightspace-client');
		autorun(async() => {
			if (this.rootStore.routingStore.page === 'producer'
				&& this.rootStore.routingStore.params.id
			) {
				this._loading = true;
				this._content = await this.apiClient.getContent(this.rootStore.routingStore.params.id);
				if (this._content?.revisions) {
					this._revisionsLatestToOldest = this._content.revisions.slice().reverse();
				}
				this._sourceUrl = (await this.apiClient.getSignedUrl(this.rootStore.routingStore.params.id)).value;
				this._setupLanguages();
				this._metadata = await this.apiClient.getMetadata({
					contentId: this._content.id,
					revisionId: 'latest',
					draft: true
				});
				this._loading = false;
			}
		});
	}

	render() {
		if (this._loading) {
			return html`<d2l-loading-spinner size=150></d2l-loading-spinner>`;
		}

		return html`
			<div class="d2l-capture-central-producer">
				${this._renderBreadcrumbs()}
				<div class="d2l-capture-central-producer-controls">
					<d2l-labs-video-producer-language-selector
						.languages="${this._languages}"
						.selectedLanguage="${this._selectedLanguage}"
						@selected-language-changed="${this._handleSelectedLanguageChanged}"
					></d2l-labs-video-producer-language-selector>
					<d2l-dropdown-button-subtle
						class="d2l-capture-central-producer-controls-revision-dropdown"
						text="${this.localize('revisionNumber', { number: (this._revisionsLatestToOldest ? this._revisionsLatestToOldest.length - this._selectedRevisionIndex : 1) })}"
					>
						<d2l-dropdown-menu
							@d2l-menu-item-select="${this._handleSelectedRevisionChanged}"
						>
							<d2l-menu label="${this.localize('revisions')}">
								${this._revisionsLatestToOldest ? this._revisionsLatestToOldest.map((revision, index) => html`<d2l-menu-item data-revision-index="${index}" text="${this.localize('revisionNumber', { number: this._revisionsLatestToOldest.length - index })}"></d2l-menu-item>`) : ''}
							</d2l-menu>
						</d2l-dropdown-menu>
					</d2l-dropdown-button-subtle>
					<d2l-button
						class="d2l-capture-central-producer-controls-save-button"
						@click="${this._handleSave}"
						?disabled="${this._saving || this._finishing}"
						text="${this.localize('saveDraft')}"
					>
						${this.localize('saveDraft')}
					</d2l-button>
					<d2l-button
						?disabled="${this._saving || this._finishing}"
						@click="${this._handleFinish}"
						class="d2l-capture-central-producer-controls-publish-button"
						primary
					><div class="d2l-capture-central-producer-controls-publishing" style="${!this._finishing ? 'display: none' : ''}">
							<d2l-loading-spinner size="20"></d2l-loading-spinner>
							${this.localize('finishing')}
						</div>
						<div ?hidden="${this._finishing}">
							${this.localize('finish')}
						</div>
					</d2l-button>
				</div>

				<d2l-capture-producer
					.defaultLanguage="${this._defaultLanguage}"
					.metadata="${this._metadata}"
					.selectedLanguage="${this._selectedLanguage}"
					@metadata-changed="${this._handleMetadataChanged}"
					src="${this._sourceUrl}"
				></d2l-capture-producer>

				<d2l-alert-toast type="${this.errorOccurred ? 'error' : 'default'}">
					${this._alertMessage}
				</d2l-alert-toast>

				<d2l-dialog-confirm
					class="d2l-capture-central-producer-dialog-confirm-revision-change"
					text="${this.localize('confirmRevisionChangeWithUnsavedData')}"
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

	get producer() {
		return this.shadowRoot.querySelector('d2l-labs-video-producer');
	}

	async _handleFinish() {
		this._finishing = true;

		await this.apiClient.updateMetadata({
			contentId: this._content.id,
			metadata: this._metadata,
			revisionId: 'latest',
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
			? this.localize('publishError')
			: this.localize('publishSuccess');
		this.shadowRoot.querySelector('d2l-alert-toast').open = true;
		this._finishing = false;
	}

	_handleMetadataChanged(e) {
		this._metadata = e.detail;
		this._unsavedChanges = true;
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
		if (newlySelectedRevisionIndex === this._selectedRevisionIndex) {
			return;
		}
		this._revisionIndexToLoad = newlySelectedRevisionIndex;
		if (this._unsavedChanges) {
			this.shadowRoot.querySelector('.d2l-capture-central-producer-dialog-confirm-revision-change').open();
		} else {
			this._loadNewlySelectedRevision();
		}
	}

	async _loadNewlySelectedRevision() {
		const revisionId = this._revisionsLatestToOldest[this._revisionIndexToLoad].id;
		this._loading = true;
		this._metadata = await this.apiClient.getMetadata({
			contentId: this._content.id,
			revisionId: revisionId,
			draft: true
		});
		this._selectedRevisionIndex = this._revisionIndexToLoad;
		this._loading = false;
		this._unsavedChanges = false;
	}

	_renderBreadcrumbs() {
		return html`
			<d2l-breadcrumbs>
				<d2l-breadcrumb
					@click=${this._goTo(`/${pageNames.myVideos}`)}
					href=""
					text="${this.localize('myVideos')}"
				></d2l-breadcrumb>
				<d2l-breadcrumb-current-page
					text="${this._content.title}"
				></d2l-breadcrumb-current-page>
			</d2l-breadcrumbs>
		`;
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
customElements.define('d2l-capture-central-producer', D2LCaptureCentralProducer);
