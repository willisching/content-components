import { css, html, LitElement } from 'lit-element/lit-element.js';
import '../d2l-content-selector-list.js';
import '../d2l-content-topic-settings.js';
import '../d2l-content-uploader.js';
import '../d2l-content-properties.js';
import { InternalLocalizeMixin } from './src/mixins/internal-localize-mixin.js';
import { ContentServiceApiClient } from 'd2l-content-service-api-client';
import ContentServiceBrowserHttpClient from 'd2l-content-service-browser-http-client';

const VIEW = Object.freeze({
	LIST: 'list',
	SETTINGS: 'settings',
	UPLOAD: 'upload',
	PROPERTIES: 'properties'
});

class ContentSelector extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			allowUpload: { type: Boolean },
			canShareTo: { type: Array },
			context: { type: String },
			maxFilesPerUpload: { type: Number },
			maxFileUploadSize: { type: Number },
			selectedObject: { type: String, reflect: true },
			serviceUrl: { type: String },
			orgUnitId: { type: String },
			tenantId: { type: String },

			_contentId: { type: String },
			_resourceType: { type: String },
			_nextButtonSettingsDisabled: { type: Boolean },
			_saveButtonPropertiesDisabled: { type: Boolean },
			_selectedView: { type: String },
			_topicId: { type: String },
		};
	}

	static get styles() {
		return css`
		.action-group {
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			background-color: white;
		}

		.bottom-padding {
			padding-bottom: 50px;
		}
		`;
	}

	constructor() {
		super();

		this.allowUpload = true;
		this.maxFilesPerUpload = 0;
		this.autoSelectAfterUpload = false;
		this.editPropertiesAfterUpload = true;
		this.editTopicPropertiesAfterSelection = false;
		this.showPreviewAfterSelection = false;
		this.selectedObject = null;
		this.serviceUrl = '';
		this.tenantId = '';
		this.context = '';
		this.orgUnitId = '';
		this._contentId = '';
		this._resourceType = '';

		this._nextButtonSettingsDisabled = true;
		this._saveButtonPropertiesDisabled = false;
		this._selectedView = VIEW.LIST;
	}

	connectedCallback() {
		super.connectedCallback();

		const httpClient = new ContentServiceBrowserHttpClient({serviceUrl: this.serviceUrl});
		this.client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });
	}

	render() {
		switch (this._selectedView) {
			case VIEW.LIST:
				return html`
				<div class="bottom-padding">
					<d2l-content-selector-list
						?allowUpload=${this.allowUpload}
						allowSelection
						serviceUrl=${this.serviceUrl}
						showDeleteAction
						showRevisionUploadAction
						showEditPropertiesAction
						showPreviewAction
						tenantId='${this.tenantId}'
						@object-selected=${this.enableNextButton}
						@on-upload-button-click=${this.handleListUpload}
					></d2l-content-selector-list>
				</div>
				<div class="action-group">
					<d2l-button
						@click="${this.handleListNext}"
						primary
						description=${this.localize('next')}
						?disabled=${this._nextButtonSettingsDisabled}
					>${this.localize('next')}</d2l-button>
					<d2l-button
						@click="${this._handleCancelButton}"
						description=${this.localize('cancel')}
					>${this.localize('cancel')}</d2l-button>
				</div>
				`;
			case VIEW.SETTINGS:
				return html`
				<div class="bottom-padding">
					<d2l-content-topic-settings
						contentId=${this._contentId}
						tenantId=${this.tenantId}
						resourceType=${this._resourceType}
						serviceUrl=${this.serviceUrl}
						context=${this.context}
					></d2l-content-topic-settings>
				</div>
				<div class="action-group">
					<d2l-button
						primary
						description=${this.localize('add')}
						@click=${this.handleSettingsAddContent}
					>${this.localize('add')}</d2l-button>
					<d2l-button
						description=${this.localize('back')}
						@click=${this.handleSettingsBack}
					>${this.localize('back')}</d2l-button>
				</div>
				`;
			case VIEW.UPLOAD:
				return html`
				<div class="bottom-padding">
					<div id="uploader-wrapper">
						<d2l-content-uploader
							api-endpoint=${this.serviceUrl}
							can-manage
							can-upload
							org-unit-id=${this.context}
							tenant-id=${this.tenantId}
							topic-id=""
							max-file-upload-size=${this.maxFileUploadSize}
							@on-upload-success=${this.handleUploadSuccess}
						></d2l-content-uploader>
					</div>
					<div class="action-group">
						<d2l-button
							description=${this.localize('back')}
							@click=${this._uploadBack}
						>${this.localize('back')}</d2l-button>
						<d2l-button
							description=${this.localize('cancel')}
							@click=${this._uploadBack}
						>${this.localize('cancel')}</d2l-button>
					</div>
				</div>
				`;
			case VIEW.PROPERTIES:
				return html`
				<div class="bottom-padding">
					<d2l-content-properties
						d2lrn=${this.selectedObject}
						serviceUrl=${this.serviceUrl}
						.canShareTo=${this.canShareTo}
						canSelectShareLocation
						embedFeatureEnabled
					></d2l-content-properties>
				</div>
				<div class="action-group">
					<d2l-button
						primary
						description=${this.localize('save')}
						@click=${this.handlePropertiesSaved}
						?disabled=${this._saveButtonPropertiesDisabled}
					>${this.localize('save')}</d2l-button>
					<d2l-button
						description=${this.localize('back')}
						@click=${this.handleSettingsBack}
					>${this.localize('back')}</d2l-button>
				</div>
				`;
			default:
				return html`<p>something went wrong</p>`;
		}
	}

	get contentProperties() {
		return this.shadowRoot.querySelector('d2l-content-properties');
	}

	enableNextButton() {
		this._nextButtonSettingsDisabled = false;
	}

	handleListNext() {
		const selectedItem = this.selectorList.selectedItem;

		this._contentId = selectedItem.id;
		this._resourceType = selectedItem.lastRevType.toLowerCase();

		this._selectedView = VIEW.SETTINGS;
	}

	handleListUpload() {
		this._selectedView = VIEW.UPLOAD;
	}

	async handlePropertiesSaved() {
		this._saveButtonPropertiesDisabled = true;
		await this.contentProperties.save();
		this._saveButtonPropertiesDisabled = false;

		this._selectedView = VIEW.LIST;
	}

	async handleSettingsAddContent() {
		const content = this.topicSettings.getContent();
		await this.client.topic.postItem(content);
		this._openPreview();
	}

	handleSettingsBack() {
		this._selectedView = VIEW.LIST;
	}

	handleUploadSuccess({ detail: { d2lrn } }) {
		this.selectedObject = d2lrn;
		this._selectedView = VIEW.PROPERTIES;
	}

	get selectorList() {
		return this.shadowRoot.querySelector('d2l-content-selector-list');
	}

	get topicSettings() {
		return this.shadowRoot.querySelector('d2l-content-topic-settings');
	}

	_cancel() {
		this.dispatchEvent(new CustomEvent('on-cancel'));
	}

	_openPreview() {
		this.dispatchEvent(new CustomEvent('on-open-preview'));
	}

	_uploadBack() {
		this._selectedView = VIEW.LIST;
	}

}

customElements.define('d2l-content-selector', ContentSelector);
