import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ContentServiceApiClient, getRegion } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { ProviderMixin } from '@brightspace-ui/core/mixins/provider-mixin.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';

import '../d2l-content-selector-list.js';
import '../d2l-content-topic-settings.js';
import '../d2l-drop-uploader.js';
import '../d2l-content-properties.js';
import '../d2l-bulk-complete.js';
import '../d2l-upload-progress.js';
import { buildOrgUnitShareLocationStr } from '../../util/sharing.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';

import { parse as d2lrnParse, toString as d2lrnToString, build as buildD2lRn } from '../../util/d2lrn.js';
import { ContentCacheDependencyKey, ContentCache } from '../../models/content-cache.js';
import ContentType from '../../util/content-type.js';

const VIEW = Object.freeze({
	BULK: 'bulk',
	LIST: 'list',
	LOADING: 'loading',
	MAINTENANCE: 'maintenance',
	PROPERTIES: 'properties',
	PROGRESS: 'progress',
	SETTINGS: 'settings',
	UPLOAD: 'upload',
});

const SPINNER_SIZE = 150;
const ALLOW_ASYNC = false;

class ContentSelector extends ProviderMixin(InternalLocalizeMixin(LitElement)) {
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
			supportedTypes: { type: Array, attribute: 'supported-types' },
			tenantId: { type: String, attribute: 'tenant-id' },
			canManageAllObjects: { type: Boolean, attribute: 'can-manage-all-objects' },
			canManageSharedObjects: { type: Boolean, attribute: 'can-manage-shared-objects' },
			userId: { type: String, attribute: 'user-id' },
			isMultipart: { type: Boolean, attribute: 'is-multipart' },

			_addButtonDisabled: { type: Boolean },
			_contentId: { type: String },
			_hasFailures: { type: Boolean },
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

			.center-content {
				top: 50%;
				left: 50%;
				position: absolute;
				transform: translate(-50%, -50%);
			}

			d2l-content-selector-list {
				height: 100%;
			}

			.action-group {
				padding-top: 2px;
			}
		`;
	}

	constructor() {
		super();

		this.allowUpload = true;
		this.maxFileUploadSize = 4 * 1024 * 1024 * 1024;
		this.autoSelectAfterUpload = false;
		this.editPropertiesAfterUpload = true;
		this.editTopicPropertiesAfterSelection = false;
		this.showPreviewAfterSelection = false;
		this.supportedTypes = [ContentType.SCORM];

		this._region = null;
		this._client = null;
		this._value = null;
		this._errorMessage = null;
		this._nextButtonSettingsDisabled = true;
		this._saveButtonPropertiesDisabled = true;
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

		this.provideInstance(ContentCacheDependencyKey, new ContentCache());
	}

	async connectedCallback() {
		super.connectedCallback();
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this._client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });
		this._region = getRegion({ serviceUrl: this.serviceUrl });
		const { scormStatus } = await this._client.status.getStatus();
		if (scormStatus === 'maintenance') {
			this._selectedView = VIEW.MAINTENANCE;
		}
	}

	render() {
		switch (this._selectedView) {
			case VIEW.LOADING:
				return html`
					<d2l-loading-spinner
						class="center-content"
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
								?canManageSharedObjects=${this.canManageSharedObjects}
								.contentTypes=${this.supportedTypes}
								orgUnitId=${this.context}
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
								@click="${this._handleCancel()}"
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
								@topic-settings-loaded=${this._handleTopicSettingsLoaded}
							></d2l-content-topic-settings>
						</div>
						<div class="action-group">
							<d2l-button
								primary
								?disabled=${this._addButtonDisabled}
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
								?is-multipart=${this.isMultipart}
								max-file-size=${this.maxFileUploadSize}
								sharing-org-unit-id=${this.context}
								.shareUploadsWith=${this._shareUploadsWith}
								.supportedTypes=${this.supportedTypes}
								@change-view=${this.changeView}
								@preupload-reset=${this.progressReset}
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
								orgUnitId=${this.context}
								totalFiles=${this._uploadSuccessFiles}
								progress=${this._propertyProgress}
								userId=${this.userId}
								embedFeatureEnabled
								@enable-save=${this._enableSaveButton}
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
								@click=${this._handleCancel(true)}
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
			case VIEW.MAINTENANCE:
				return html`
					<div class="center-content">${this.localize('performingMaintenance')}</div>
				`;
			default:
				return html`<p>something went wrong</p>`;
		}
	}

	bulkUploadDetails(event) {
		this._fileName = event.detail.fileName;
		this._totalFiles = event.detail.totalFiles;
	}

	changeHeader(header) {
		this.dispatchEvent(new CustomEvent('change-heading', {
			detail: {
				heading: header,
			},
			bubbles: true,
			composed: true,
		}));
	}

	changeView(event) {
		this._fileName = event.detail.fileName;
		this._selectedView = VIEW[event.detail.view];
		this._errorMessage = event.detail.errorMessage;
		// keep a reference to the uploader so that can call to cancel uploads
		if (this._dropUploader) {
			this.uploader = this._dropUploader;
		}
	}

	editBulkProperties() {
		this._selectedView = VIEW.LOADING;
		const d2lrn = this._d2lrnList.shift();
		this._contentId = d2lrn[0];
		this.selectedObject = d2lrn[1];
		this.changeHeader(this.localize('configureCoursePackagePropertiesBulk', { 0: this._propertyProgress, 1: this._uploadSuccessFiles }));
		this._selectedView = VIEW.PROPERTIES;
	}

	onProgress(event) {
		this._uploadProgress = event.detail.progress;
		this.requestUpdate();
	}

	progressReset() {
		this._bulkErrorMessages = {};
		this._errorMessage = null;
		this._progress = 0;
		this._uploadProgress = 0;
		this._propertyProgress = 1;
	}

	reactToUploadError(event) {
		this._progress += 1;
		this._errorMessage = event.detail.errorMessage;
		this._bulkErrorMessages[event.detail.fileName] = this._errorMessage;
		// if bulk and last file is error, show bulk-complete failure page
		if (this._progress === this._totalFiles) {
			this._hasFailures = true;
			this.changeHeader(this.localize('upload'));
			this._selectedView = VIEW.BULK;
		}
		this.requestUpdate();
	}

	reactToUploaderSuccess(event) {
		console.log('yay, we can change content-components');
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
			this.changeHeader(this.localize('configureCoursePackageProperties'));
			this._selectedView = VIEW.PROPERTIES;
		} else {
			// if bulk, add to list of d2lrns for properties later
			this._d2lrnList.push([this._contentId, this.selectedObject]);
			if (this._progress === this._totalFiles) {
				this._hasFailures = this._uploadSuccessFiles !== this._totalFiles;
				this.changeHeader(this.localize('upload'));
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

	get _dropUploader() {
		return this.shadowRoot.querySelector('d2l-drop-uploader');
	}

	_enableNextButton() {
		this._nextButtonSettingsDisabled = false;
	}

	_enableSaveButton() {
		this._saveButtonPropertiesDisabled = false;
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

	_handleCancel(cancelUpload = false) {
		return () => {
			if (cancelUpload) {
				this.uploader.cancelUpload();
			}
			this.dispatchEvent(new CustomEvent('cancel'));
		};
	}

	_handleListEditProperties({ detail: { selectedItem } }) {
		// prevent button clicks until everything is fully loaded, event after loading will enable it again
		this._saveButtonPropertiesDisabled = true;
		this.selectedObject = '';
		this._contentId = selectedItem.id;
		this.changeHeader(this.localize('editCoursePackageProperties'));
		this._selectedView = VIEW.PROPERTIES;
		this.dispatchEvent(new CustomEvent('change-view-properties'));
	}

	_handleListNext() {
		const selectedItem = this._selectorList.selectedContent;

		this._contentId = selectedItem.id;
		this.changeHeader(this.localize('contentItemFormTitle'));
		this._addButtonDisabled = true;
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

		window.open(`/d2l/le/contentservice/launch/preview?d2lrn=${d2lrn}&title=${encodeURIComponent(title)}&ou=${this.context}`, '_blank');
	}

	async _handlePropertiesSaved() {
		this._saveButtonPropertiesDisabled = true;
		await this._contentProperties.save();
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

	_handleTopicSettingsLoaded() {
		this._addButtonDisabled = false;
	}

	_navigateToUpload() {
		// after returning from bulk upload, progress values are kept so need to reset on new upload
		this.progressReset();
		this._contentId = null;
		this.changeHeader(this.localize('upload'));
		this._selectedView = VIEW.UPLOAD;
	}

	_navigateToUploadRevision(event) {
		this._contentId = event.detail.id;
		this.changeHeader(this.localize('upload'));
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
		this.changeHeader(this.localize('contentServiceTitle'));
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
					@click=${this._handleCancel()}
				>${this.localize('cancel')}</d2l-button>
			</div>
		`;
	}

	get _selectorList() {
		return this.shadowRoot.querySelector('d2l-content-selector-list');
	}

	get _shareUploadsWith() {
		return this.canShareTo && this.canShareTo.length > 0 &&
			(this.canSelectShareLocation ? [this.canShareTo[0]] : this.canShareTo)
				.map(({ id }) => buildOrgUnitShareLocationStr(id));
	}

	get _topicSettings() {
		return this.shadowRoot.querySelector('d2l-content-topic-settings');
	}

	_uploadBack() {
		this._navToList();
	}
}

customElements.define('d2l-content-selector', ContentSelector);
