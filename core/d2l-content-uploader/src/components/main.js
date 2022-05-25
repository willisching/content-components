import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { ProviderMixin } from '@brightspace-ui/core/mixins/provider-mixin.js';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import ContentServiceClient from '../util/content-service-client.js';
import UserBrightspaceClient from '../util/user-brightspace-client.js';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';
import { Uploader } from '../state/uploader.js';
import { parse as d2lrnParse, toString as d2lrnToString } from '../util/d2lrn.js';

import './upload.js';
import './preview.js';
import './progress.js';
import './bulk-complete.js';
import '../../../d2l-content-properties';

const VIEW = Object.freeze({
	UPLOAD: 'UPLOAD',
	PREVIEW: 'PREVIEW',
	PROGRESS: 'PROGRESS',
	LOADING: 'LOADING',
	BULKCOMPLETE: 'BULKCOMPLETE',
	PROPERTIES: 'PROPERTIES'
});

export class Main extends InternalLocalizeMixin(MobxReactionUpdate(ProviderMixin(LitElement))) {
	static get properties() {
		return {
			allowAsyncProcessing: { type: Boolean, attribute: 'allow-async-processing' },
			apiEndpoint: { type: String, attribute: 'api-endpoint' },
			canManage: { type: Boolean, attribute: 'can-manage' },
			canUpload: { type: Boolean, attribute: 'can-upload' },
			orgUnitId: { type: String, attribute: 'org-unit-id' },
			tenantId: { type: String, attribute: 'tenant-id' },
			topicId: { type: String, attribute: 'topic-id' },
			maxFileUploadSize: { type: String, attribute: 'max-file-upload-size' },
			supportedTypes: { type: Array, attribute: 'supported-types' },
			enablePreview: { type: Boolean, attribute: 'enable-preview' },
			enableBulkUpload: { type: Boolean, attribute: 'enable-bulk-upload' },
			filename: { type: String, reflect: true },
			value: { type: String, reflect: true },

			_currentView: { type: Number, attribute: false },
			_errorMessage: { type: String, attribute: false },
			_fileName: { type: String, attribute: false },
			_fileSize: { type: Number, attribute: false },
			_fileType: { type: String, attribute: false },
			_totalFiles: { type: Number, attribute: false },
			_progress: { type: Number, attribute: false },
			_completedFiles: { type: Number, attribute: false },
			_bulkErrorMessages: { type: Object, attribute: false },
			_d2lrnList: { type: Array, attribute: false },
		};
	}

	static get styles() {
		return css`
		`;
	}

	constructor() {
		super();
		this._currentView = VIEW.LOADING;
		this._errorMessage = '';
		this._fileName = '';
		this._fileSize = 0;
		this._fileType = '';
		this.reactToUploadError = this.reactToUploadError.bind(this);
		this.reactToUploadSuccess = this.reactToUploadSuccess.bind(this);
		this._bulkErrorMessages = {};
	}

	async connectedCallback() {
		super.connectedCallback();
		const apiClient = new ContentServiceClient({
			endpoint: this.apiEndpoint,
			tenantId: this.tenantId,
		});
		this.provideInstance('content-service-client', apiClient);

		const userBrightspaceClient = new UserBrightspaceClient();
		this.provideInstance('user-brightspace-client', userBrightspaceClient);

		this._uploader = new Uploader({
			apiClient,
			onSuccess: this.reactToUploadSuccess,
			onError: this.reactToUploadError,
			waitForProcessing: !this.allowAsyncProcessing,
		});

		if (this.value) {
			if (!this.topicId) {
				const revision = await apiClient.getRevisionByName(this.value);
				this._fileType = revision.type.toLowerCase();
				this._fileName = revision.title;
			}
			this._currentView = VIEW.PREVIEW;
		} else {
			this._currentView = VIEW.UPLOAD;
		}
	}

	render() {
		let view;
		switch (this._currentView) {
			case VIEW.LOADING:
				return html`<d2l-loading-spinner></d2l-loading-spinner>`;

			case VIEW.UPLOAD:
				// should happen if the user has canManage permission otherwise we should
				view = this.canUpload ? html`
					<d2l-content-uploader-upload
						id="prompt-with-file-drop-enabled"
						error-message=${this._errorMessage}
						max-file-size=${this.maxFileUploadSize}
						enable-bulk-upload=${ifDefined(this.enableBulkUpload)}
						supported-types=${JSON.stringify(this.supportedTypes)}
						@file-change=${this.onFileChange}
						@file-error=${this.onUploadError}>
					</d2l-content-uploader-upload>
				` : html`<d2l-loading-spinner></d2l-loading-spinner>`;
				break;
			case VIEW.PREVIEW:
				view = html`
					<d2l-content-uploader-preview
						?allow-async-processing=${this.allowAsyncProcessing}
						?can-manage=${this.canManage}
						?can-upload=${this.canUpload}
						file-name=${this._fileName}
						resource=${this.value}
						@cancel=${this.onDiscardStagedFile}
						org-unit-id=${this.orgUnitId}
						topic-id=${ifDefined(this.topicId)}
					>
					</d2l-content-uploader-preview>
				`;
				break;
			case VIEW.PROGRESS:
				view = html`
					<d2l-content-uploader-progress
						file-name=${this._fileName}
						total-files=${this._totalFiles}
						completed-files=${this._completedFiles}
						upload-progress=${this._uploader.uploadProgress}>
					</d2l-content-uploader-progress>
				`;
				break;
			case VIEW.BULKCOMPLETE:
				view = html`
					<d2l-content-uploader-bulk-complete
						file-name=${this._fileName}
						total-files=${this._totalFiles}
						completed-files=${this._completedFiles}
						bulk-error-messages=${JSON.stringify(this._bulkErrorMessages)}
						@upload-view=${this.uploadView}
						@edit-properties=${this.editProperties}
						@default-properties=${this.defaultProperties}

						>
					</d2l-content-uploader-bulk-complete>
				`;
				break;
			case VIEW.PROPERTIES:
				// d2lrn should be able to take a list of d2lrns
				// change canShareTo to proper later
				view = html`
					<d2l-content-properties
						d2lrn=${this._d2lrnList}
						serviceUrl=${this.apiEndpoint}
						canShareTo='[{"id": "6606", "name": "Dev"}, {"id": "6609", "name": "Prod"}]'
						canSelectShareLocation
						embedFeatureEnabled
					></d2l-content-properties>
				`;
		}
		return view;
	}

	cancelUpload() {
		if (this._currentView === VIEW.PROGRESS) {
			this._uploader.cancelUpload()
				.catch(() => {
					this._errorMessage = this.localize('workerErrorCancelUploadFailed');
				})
				.finally(() => {
					this.onDiscardStagedFile();
				});
		}
	}

	defaultProperties() {
		// current behaviour is to return to content selector
		this.dispatchEvent(new CustomEvent('default-properties'));
	}

	editProperties() {
		this._currentView = VIEW.PROPERTIES;
	}

	onDiscardStagedFile() {
		if (this.canUpload) {
			this.uploadView();
			this.updateValue('');
			this.topicId = '';
			this.canManage = this.canUpload;
		}
	}

	onFileChange(event) {
		this.startUpload(event);
	}

	onUploadError(event) {
		this._errorMessage = event.detail.message;
		this._file = undefined;
		this._fileName = '';
		this._fileSize = 0;
		this._fileType = '';
		this._currentView = VIEW.UPLOAD;
	}

	reactToUploadError(error) {
		this._progress += 1;
		this._errorMessage = this.localize(error);
		this._bulkErrorMessages[this._fileName] = this._errorMessage;
		this._file = undefined;
		this._fileName = '';
		this._fileSize = 0;
		this._fileType = '';
		// go back to uploading view if only a single file was uploaded
		if (this._totalFiles === 1) {
			this.uploadView();
		} else if (this._progress === this._totalFiles) {
			// if bulk and last file is error, show bulk-complete
			this._currentView = VIEW.BULKCOMPLETE;
			this._uploader.reset();
		}
	}

	reactToUploadSuccess(value) {
		this._completedFiles += 1;
		this._progress += 1;
		// if bulk upload, need to make sure all files have been uploaded before continuing
		if (this._progress !== this._totalFiles) {
			// update progress and continue to wait
			return;
		}

		this.canManage = this.canUpload;
		this.updateValue(value);
		this._d2lrnList.push(value);
		if (this._totalFiles > 1) {
			// update _currentView to multipage editing dialog if bulk
			this._currentView = VIEW.BULKCOMPLETE;
		} else if (this.enablePreview || this.enablePreview === undefined) {
			// if only a single file is uploaded, allow editing after finished
			this.updateValue(value);
			this.dispatchEvent(new Event('change', {
				bubbles: true,
				composed: true,
			}));
			this._currentView = VIEW.PREVIEW;
		} else {
			// if preview is disabled, then go to properties page
			this.updateValue(value);
			this._currentView = VIEW.PROPERTIES;
		}
	}

	async startUpload(event) {
		const files = event.detail.acceptedFiles;
		this._totalFiles = files.length;
		this._progress = 0;
		this._completedFiles = 0;
		this._d2lrnList = [];
		this._currentView = VIEW.PROGRESS;
		for (let index = 0; index < this._totalFiles; index++) {
			const file = files[index];
			this._file = file;
			this._fileName = file.name;
			this._fileSize = file.size;
			this._fileType = file.type;
			this._errorMessage = '';
			await this._uploader.uploadFile(this._file, this._fileName, this._fileType, this._totalFiles);
		}
	}

	updateValue(value) {
		if (value) {
			const d2lrn = d2lrnParse(value);
			d2lrn.resource = `${d2lrn.contentId}/latest`;
			delete d2lrn.contentId;
			delete d2lrn.revisionId;
			this.value = d2lrnToString(d2lrn);
		} else {
			this.value = value;
		}
		this.filename = this._fileName;
	}

	uploadView() {
		this._uploader.reset();
		this._errorMessage = '';
		this._file = undefined;
		this._fileName = '';
		this._fileSize = 0;
		this._fileType = '';
		this._d2lrnList = [];
		this._currentView = VIEW.UPLOAD;
	}
}

customElements.define('d2l-content-uploader', Main);
