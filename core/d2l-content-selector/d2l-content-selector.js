import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ContentServiceApiClient, getRegion } from '@d2l/content-service-api-client';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';

import '../d2l-content-selector-list.js';
import '../d2l-content-topic-settings.js';
import '../d2l-drop-uploader.js';
import '../d2l-content-properties.js';
import '../d2l-bulk-complete.js';
import '../d2l-upload-progress.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { parse as d2lrnParse, toString as d2lrnToString, build as buildD2lRn } from '../../util/d2lrn.js';
import ContentType from '../../util/content-type.js';

const VIEW = Object.freeze({
	LIST: 'list',
	SETTINGS: 'settings',
	UPLOAD: 'upload',
	PROPERTIES: 'properties',
	BULK: 'bulk',
	PROGRESS: 'progress',
	LOADING: 'loading',
});

const SPINNER_SIZE = 150;
const SUPPORTED_TYPES = [ContentType.SCORM];
const ALLOW_ASYNC = false;

class ContentSelector extends InternalLocalizeMixin(MobxReactionUpdate(LitElement)) {
	static get properties() {
		return {
			allowUpload: { type: Boolean, attribute: 'allow-upload' },
			canSelectShareLocation: { type: Boolean, attribute: 'can-select-share-location' },
			canShareTo: { type: Array, attribute: 'can-share-to' },
			context: { type: String },
			maxFileUploadSize: { type: Number, attribute: 'max-file-upload-size' },
			searchLocations: { type: Array, attribute: 'search-locations' },
			selectedObject: { type: String, reflect: true, attribute: 'selected-object' },
			serviceUrl: { type: String, attribute: 'service-url' },
			tenantId: { type: String, attribute: 'tenant-id' },
			canManageAllObjects: { type: Boolean, attribute: 'can-manage-all-objects' },
			userId: { type: String, attribute: 'user-id' },

			_hasFailures: { type: Boolean },
			_contentId: { type: String },
			_nextButtonSettingsDisabled: { type: Boolean },
			_saveButtonPropertiesDisabled: { type: Boolean },
			_selectedView: { type: String },
			_topicId: { type: String },
		};
	}

	static get styles() {
		return css`
			.view-container {
				display: flex;
				flex-direction: column;
				height: 100%;
			}

			.main-view {
				flex: 1;
				overflow: auto;
			}

			.full-height {
				height:100%;
			}

			.loading-spinner {
				top: 50%;
				left: 50%;
				position: absolute;
				transform: translate(-50%, -50%);
			}

			d2l-content-selector-list {
				height: 100%;
			}

			.action-group {
				padding-top: 5px;
			}
		`;
	}

	constructor() {
		super();

		this.allowUpload = true;
		this.maxFileUploadSize = 2000000000;
		this.autoSelectAfterUpload = false;
		this.editPropertiesAfterUpload = true;
		this.editTopicPropertiesAfterSelection = false;
		this.showPreviewAfterSelection = false;

		this._region = null;
		this._client = null;
		this._value = null;
		this._errorMessage = null;
		this._nextButtonSettingsDisabled = true;
		this._saveButtonPropertiesDisabled = false;
		this._selectedView = VIEW.LIST;
		this._bulkErrorMessages = {};
		this._totalFiles = 0;
		this._uploadSuccessFiles = 0;
		this._progress = 0;
		this._propertyProgress = 1;
		this._d2lrnList = [];
		this._fileName = null;
		this._uploadProgress = 0;
		this._hasFailures = false;
	}

	async connectedCallback() {
		super.connectedCallback();
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this._client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });
		this._region = getRegion({ serviceUrl: this.serviceUrl });
	}

	render() {
		switch (this._selectedView) {
			case VIEW.LOADING:
				return html`
					<d2l-loading-spinner
						class="loading-spinner"
						size=${SPINNER_SIZE}
					></d2l-loading-spinner>
				`;
			case VIEW.LIST:
				return html`
					<div class='view-container'>
						<div class='main-view'>
							<d2l-content-selector-list
								?allowUpload=${this.allowUpload}
								allowSelection
								?canManageAllObjects=${this.canManageAllObjects}
								.searchLocations=${this.searchLocations}
								serviceUrl=${this.serviceUrl}
								showDeleteAction
								showRevisionUploadAction
								showEditPropertiesAction
								showPreviewAction
								tenantId=${this.tenantId}
								userId=${this.userId}
								@object-selected=${this._enableNextButton}
								@on-upload-button-click=${this._navigateToUpload}
								@revision-upload-requested=${this._navigateToUploadRevision}
								@show-preview=${this._handleListShowPreview}
								@show-edit-properties=${this._handleListEditProperties}
							></d2l-content-selector-list>
						</div>
						<div class="action-group">
							<d2l-button
								id="selector-list-next"
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
					</div>
				`;
			case VIEW.SETTINGS:
				return html`
					<div class="view-container">
						<div class="main-view">
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
								id='topic-settings-back'
								description=${this.localize('back')}
								@click=${this._handleSettingsBack}
							>${this.localize('back')}</d2l-button>
						</div>
					</div>
				`;
			case VIEW.UPLOAD:
				return html`
					<div class="view-container">
						<div id="uploader-wrapper" class="main-view">
							<d2l-drop-uploader
								id="prompt-with-file-drop-enabled"
								tenant-id=${this.tenantId}
								api-endpoint=${this.serviceUrl}
								?allowAsyncProcessing=${ALLOW_ASYNC}
								existing-content-id=${this._contentId}
								error-message=${this._errorMessage}
								max-file-size=${this.maxFileUploadSize}
								.supportedTypes=${SUPPORTED_TYPES}
								@change-view=${this.changeView}
								@on-uploader-error=${this.reactToUploadError}
								@on-uploader-success=${this.reactToUploaderSuccess}
								@on-progress=${this.onProgress}
								@bulk-upload-details=${this.bulkUploadDetails}
								enable-bulk-upload>
							</d2l-drop-uploader>
						</div>
						<div class="action-group">
							<d2l-button
								id='uploader-back'
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
					<div class='view-container'>
						<div class="main-view">
							<d2l-content-properties
								d2lrn=${this.selectedObject}
								serviceUrl=${this.serviceUrl}
								contentId=${this._contentId}
								tenantId=${this.tenantId}
								?canSelectShareLocation=${this.canSelectShareLocation}
								.canShareTo=${this.canShareTo}
								totalFiles=${this._uploadSuccessFiles}
								progress=${this._propertyProgress}
								embedFeatureEnabled
							></d2l-content-properties>
						</div>
						<div class="action-group">
							<d2l-button
								primary
								description=${this._totalFiles > 0 ? this.localize('next') : this.localize('save')}
								@click=${this._handlePropertiesSaved}
								?disabled=${this._saveButtonPropertiesDisabled}
							>${this._totalFiles > 0 ? this.localize('next') : this.localize('save')}</d2l-button>
							<d2l-button
							id='properties-back'
							description=${this.localize('back')}
							@click=${this._handleSettingsBack}
							?hidden=${this._totalFiles > 0}
						>${this.localize('back')}</d2l-button>
						</div>
					</div>
				`;
			case VIEW.PROGRESS:
				return html`
					<div class="view-container">
						<div id="uploader-wrapper" class="main-view">
							<d2l-upload-progress
								file-name=${this._fileName}
								total-files=${this._totalFiles}
								upload-progress=${this._uploadProgress}
								completed-files=${this._progress}>
							</d2l-upload-progress>
						</div>
						<div class="action-group">
							<d2l-button
								description=${this.localize('back')}
								disabled
							>${this.localize('back')}</d2l-button>
							<d2l-button
								description=${this.localize('cancel')}
								@click=${this._handleCancel}
							>${this.localize('cancel')}</d2l-button>
						</div>
					</div>
				`;
			case VIEW.BULK:
				return html`
					<div class="view-container">
						<div id="uploader-wrapper" class="main-view">
							<d2l-bulk-complete
								file-name=${this._fileName}
								total-files=${this._totalFiles}
								completed-files=${this._uploadSuccessFiles}
								?has-failures=${this._hasFailures}
								.bulkErrorMessages=${this._bulkErrorMessages}
								@change-view=${this.changeView}
								@edit-properties=${this.editBulkProperties}
								@default-properties=${this._uploadBack}
								>
							</d2l-bulk-complete>
						</div>
						${this._hasFailures ? this._renderBulkCompleteButtons() : ''}
					</div>
				`;
			default:
				return html`<p>something went wrong</p>`;
		}
	}

	bulkUploadDetails(event) {
		this._fileName = event.detail.fileName;
		this._totalFiles = event.detail.totalFiles;
	}

	changeView(event) {
		this._fileName = event.detail.fileName;
		this._selectedView = VIEW[event.detail.view];
		this._errorMessage = event.detail.errorMessage;
	}

	editBulkProperties() {
		this._selectedView = VIEW.LOADING;
		const d2lrn = this._d2lrnList.shift();
		this._contentId = d2lrn[0];
		this.selectedObject = d2lrn[1];
		this._selectedView = VIEW.PROPERTIES;
	}

	onProgress(event) {
		this._uploadProgress = event.detail.progress;
		this.requestUpdate();
	}

	reactToUploadError(event) {
		this._progress += 1;
		this._errorMessage = event.detail.errorMessage;
		this._bulkErrorMessages[event.detail.fileName] = this._errorMessage;
		// if bulk and last file is error, show bulk-complete failure page
		if (this._progress === this._totalFiles) {
			this._hasFailures = true;
			this._selectedView = VIEW.BULK;
		}
		this.requestUpdate();
	}

	reactToUploaderSuccess(event) {
		const value = event.detail.d2lrn;
		this._uploadSuccessFiles += 1;
		this._progress += 1;

		if (value) {
			const d2lrn = d2lrnParse(value);
			d2lrn.resource = `${d2lrn.contentId}/latest`;
			this._contentId = d2lrn.resource;
			delete d2lrn.contentId;
			delete d2lrn.revisionId;
			this.selectedObject = d2lrnToString(d2lrn);
		} else {
			this.selectedObject = value;
		}

		if (this._totalFiles === 1) {
			// go to properties page if single file
			this._selectedView = VIEW.PROPERTIES;
		} else {
			// if bulk, add to list of d2lrns for properties later
			this._d2lrnList.push([this._contentId, this.selectedObject]);
			if (this._progress === this._totalFiles) {
				this._hasFailures = this._uploadSuccessFiles !== this._totalFiles;
				this._selectedView = VIEW.BULK;
			}
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
		this._selectedView = VIEW.LOADING;
		const topicSettings = this._topicSettings.getSettings();
		this._value = {
			d2lrn: buildD2lRn({
				region: this._region,
				tenantId: this.tenantId,
				resourceType: topicSettings.resourceType,
				contentId: topicSettings.contentId,
				revisionTag: topicSettings.revisionTag,
			}),
			openInNewWindow: topicSettings.openInNewWindow,
			title: topicSettings.title,
			gradeCalculationMethod: topicSettings.gradeCalculationMethod,
			gradeObjectAssociation: topicSettings.gradeObjectAssociation,
		};
		this.dispatchEvent(new CustomEvent('addtopic'));
	}

	_handleBulkContinue() {
		this._hasFailures = false;
		this.requestUpdate();
	}

	_handleCancel() {
		this.dispatchEvent(new CustomEvent('cancel'));
	}

	_handleListEditProperties({ detail: { selectedItem } }) {
		this.selectedObject = '';
		this._contentId = selectedItem.id;

		this._selectedView = VIEW.PROPERTIES;
		this.dispatchEvent(new CustomEvent('change-view-properties'));
	}

	_handleListNext() {
		const selectedItem = this._selectorList.selectedContent;

		this._contentId = selectedItem.id;

		this._selectedView = VIEW.SETTINGS;
		this.dispatchEvent(new CustomEvent('change-view-topic-settings'));
	}

	_handleListShowPreview({ detail: { id, type, title } }) {
		const d2lrn = buildD2lRn({
			region: this._region,
			tenantId: this.tenantId,
			resourceType: type.toLowerCase(),
			contentId: id,
			revisionTag: 'latest',
		});

		window.open(`/d2l/le/contentservice/launch/preview?d2lrn=${d2lrn}&title=${encodeURIComponent(title)}`, '_blank');
	}

	async _handlePropertiesSaved() {
		this._saveButtonPropertiesDisabled = true;
		await this._contentProperties.save();
		this._saveButtonPropertiesDisabled = false;
		if (this._d2lrnList.length > 0) {
			this._propertyProgress += 1;

			// move to next package
			this.editBulkProperties();

			// need to change view so that properties view will have updated values
			this._selectedView = VIEW.LOADING;

			// grab title and reset choices from another _initProperties
			await this._contentProperties._initProperties();
			this._selectedView = VIEW.PROPERTIES;
		} else {
			this._navToList();
		}
	}

	_handleSettingsBack() {
		this._navToList();
	}

	_navigateToUpload() {
		this._contentId = null;
		this._selectedView = VIEW.UPLOAD;
	}

	_navigateToUploadRevision(event) {
		this._contentId = event.detail.id;
		this._selectedView = VIEW.UPLOAD;
	}

	_navToList() {
		this._nextButtonSettingsDisabled = true;
		this._bulkErrorMessages = {};
		this._totalFiles = 0;
		this._uploadSuccessFiles = 0;
		this._progress = 0;
		this._d2lrnList = [];
		this._fileName = null;
		this._uploadProgress = 0;
		this._errorMessage = null;
		this._hasFailures = false;
		this._selectedView = VIEW.LIST;
	}

	_renderBulkCompleteButtons() {
		return html`
			<div class="action-group">
				<d2l-button
					id='bulk-complete-button'
					description=${this._uploadSuccessFiles === 0 ? this.localize('back') : this.localize('continue')}
					@click=${this._uploadSuccessFiles === 0 ? this._uploadBack : this._handleBulkContinue}
				>${this._uploadSuccessFiles === 0 ? this.localize('back') : this.localize('continue')}</d2l-button>
				<d2l-button
					description=${this.localize('cancel')}
					@click=${this._handleCancel}
				>${this.localize('cancel')}</d2l-button>
			</div>
		`;
	}

	get _selectorList() {
		return this.shadowRoot.querySelector('d2l-content-selector-list');
	}

	get _topicSettings() {
		return this.shadowRoot.querySelector('d2l-content-topic-settings');
	}

	_uploadBack() {
		this._navToList();
	}
}

customElements.define('d2l-content-selector', ContentSelector);
