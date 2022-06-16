import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ContentServiceApiClient } from 'd2l-content-service-api-client';
import ContentServiceBrowserHttpClient from 'd2l-content-service-browser-http-client';

import '../d2l-content-selector-list.js';
import '../d2l-content-topic-settings.js';
import '../d2l-content-uploader.js';
import '../d2l-content-properties.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { build as buildD2lRn } from '../../util/d2lrn';

const VIEW = Object.freeze({
	LIST: 'list',
	SETTINGS: 'settings',
	UPLOAD: 'upload',
	PROPERTIES: 'properties'
});

class ContentSelector extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			allowUpload: { type: Boolean, attribute: 'allow-upload' },
			canShareTo: { type: Array, attribute: 'can-share-to' },
			context: { type: String },
			maxFilesPerUpload: { type: Number, attribute: 'max-files-per-upload' },
			maxFileUploadSize: { type: Number, attribute: 'max-file-upload-size' },
			selectedObject: { type: String, reflect: true, attribute: 'selected-object' },
			serviceUrl: { type: String, attribute: 'service-url' },
			tenantId: { type: String, attribute: 'tenant-id' },

			_contentId: { type: String },
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
		this._region = null;
		this._client = null;
		this._value = null;

		this._nextButtonSettingsDisabled = true;
		this._saveButtonPropertiesDisabled = false;
		this._selectedView = VIEW.LIST;
	}

	async connectedCallback() {
		super.connectedCallback();

		const httpClient = new ContentServiceBrowserHttpClient({serviceUrl: this.serviceUrl});
		this._client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });
		this._region = (await this._client.region.getRegion()).region;
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
						@object-selected=${this._enableNextButton}
						@on-upload-button-click=${this._handleListUpload}
						@on-show-edit-properties=${this._handleShowEditProperties}
					></d2l-content-selector-list>
				</div>
				<div class="action-group">
					<d2l-button
						@click="${this._handleListNext}"
						primary
						description=${this.localize('next')}
						?disabled=${this._nextButtonSettingsDisabled}
					>${this.localize('next')}</d2l-button>
					<d2l-button
						@click="${this._handleCancel}"
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
						serviceUrl=${this.serviceUrl}
						context=${this.context}
					></d2l-content-topic-settings>
				</div>
				<div class="action-group">
					<d2l-button
						primary
						description=${this.localize('add')}
						@click=${this._handleAddTopic}
					>${this.localize('add')}</d2l-button>
					<d2l-button
						description=${this.localize('back')}
						@click=${this._handleSettingsBack}
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
							@on-upload-success=${this._handleUploadSuccess}
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
						@click=${this._handlePropertiesSaved}
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

	get value() {
		return this._value;
	}

	get _contentProperties() {
		return this.shadowRoot.querySelector('d2l-content-properties');
	}

	_enableNextButton() {
		this._nextButtonSettingsDisabled = false;
	}

	async _handleAddTopic() {
		const topicSettings = this._topicSettings.getSettings();
		const topic = await this._client.topic.postItem({
			topic: topicSettings.contentServiceTopic
		});
		this._value = {
			d2lrn: buildD2lRn({
				region: this._region,
				tenantId: this.tenantId,
				resourceType: topicSettings.resourceType,
				contentId: topicSettings.contentServiceTopic.contentId,
				revisionTag: topicSettings.contentServiceTopic.revisionTag
			}),
			contentServiceTopicId: topic.id,
			...topicSettings.brightspaceTopic
		};
		this.dispatchEvent(new CustomEvent('addtopic'));
	}

	_handleCancel() {
		this.dispatchEvent(new CustomEvent('cancel'));
	}

	_handleListNext() {
		const selectedItem = this._selectorList.selectedItem;

		this._contentId = selectedItem.id;

		this._selectedView = VIEW.SETTINGS;
	}

	_handleListUpload() {
		this._selectedView = VIEW.UPLOAD;
	}

	async _handlePropertiesSaved() {
		this._saveButtonPropertiesDisabled = true;
		await this._contentProperties.save();
		this._saveButtonPropertiesDisabled = false;

		this._selectedView = VIEW.LIST;
	}

	_handleSettingsBack() {
		this._selectedView = VIEW.LIST;
	}

	_handleUploadSuccess({ detail: { d2lrn } }) {
		this.selectedObject = d2lrn;
		this._selectedView = VIEW.PROPERTIES;
	}

	get _selectorList() {
		return this.shadowRoot.querySelector('d2l-content-selector-list');
	}

	get _topicSettings() {
		return this.shadowRoot.querySelector('d2l-content-topic-settings');
	}

	_uploadBack() {
		this._selectedView = VIEW.LIST;
	}
}

customElements.define('d2l-content-selector', ContentSelector);
