import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui-labs/video-producer/src/video-producer.js';
import '@brightspace-ui-labs/video-producer/src/video-producer-language-selector.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';

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
			_languages: { type: String, attribute: false },
			_loading: { type: Boolean, attribute: false },
			_metadata: { type: Object, attribute: false },
			_publishing: { type: Boolean },
			_saving: { type: Boolean },
			_selectedLanguage: { type: String, attribute: false },
			_sourceUrl: { type: String, attribute: false },
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

			.d2l-capture-central-producer-controls-save-button {
				margin-right: auto;
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

	get producer() {
		return this.shadowRoot.querySelector('d2l-labs-video-producer');
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

	async _handlePublish() {
		this._publishing = true;

		await this.apiClient.updateMetadata({
			contentId: this._content.id,
			metadata: this._metadata,
			revisionId: 'latest',
		});
		const { id, ...revision } = this._content.revisions[this._content.revisions.length - 1];
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
		this._publishing = false;
	}

	_handleMetadataChanged(e) {
		this._metadata = e.detail;
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

	render() {
		if (this._loading) {
			return html`<d2l-loading-spinner size=150></d2l-loading-spinner>`;
		}

		return html`
			<div class="d2l-capture-central-producer">
				${this._renderBreadcrumbs()}
				<div class="d2l-capture-central-producer-controls">
					<d2l-button-icon
						?disabled="${this._saving || this._publishing}"
						@click="${this._handleSave}"
						class="d2l-capture-central-producer-controls-save-button"
						icon="tier1:save"
						primary
						text="${this.localize('save')}"
					></d2l-button-icon>
					<d2l-labs-video-producer-language-selector
						.languages="${this._languages}"
						.selectedLanguage="${this._selectedLanguage}"
						@selected-language-changed="${this._handleSelectedLanguageChanged}"
					></d2l-labs-video-producer-language-selector>
					<d2l-button
						?disabled="${this._saving || this._publishing}"
						@click="${this._handlePublish}"
						class="d2l-capture-central-producer-controls-publish-button"
						primary
					><div class="d2l-capture-central-producer-controls-publishing" style="${!this._publishing ? 'display: none' : ''}">
							<d2l-loading-spinner size="20"></d2l-loading-spinner>
							${this.localize('publishing')}
						</div>
						<div ?hidden="${this._publishing}">
							${this.localize('publish')}
						</div>
					</d2l-button>
				</div>

				<d2l-labs-video-producer
					.defaultLanguage="${this._defaultLanguage}"
					.metadata="${this._metadata}"
					.selectedLanguage="${this._selectedLanguage}"
					@metadata-changed="${this._handleMetadataChanged}"
					src="${this._sourceUrl}"
				></d2l-labs-video-producer>

				<d2l-alert-toast type="${this.errorOccurred ? 'error' : 'default'}">
					${this._alertMessage}
				</d2l-alert-toast>
			</div>
		`;
	}

}
customElements.define('d2l-capture-central-producer', D2LCaptureCentralProducer);
