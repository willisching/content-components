import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import ContentServiceClient from '../util/content-service-client';
import UserBrightspaceClient from '../util/user-brightspace-client.js';
import { ProviderMixin } from '@brightspace-ui/core/mixins/provider-mixin.js';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { Uploader } from '../state/uploader';
import { parse as d2lrnParse, toString as d2lrnToString } from '../util/d2lrn';

import './upload.js';
import './preview.js';
import './progress.js';

const VIEW = Object.freeze({
	UPLOAD: 'UPLOAD',
	PREVIEW: 'PREVIEW',
	PROGRESS: 'PROGRESS',
	LOADING: 'LOADING'
});

export class Main extends MobxReactionUpdate(ProviderMixin(LitElement)) {
	static get properties() {
		return {
			apiEndpoint: { type: String, attribute: 'api-endpoint' },
			tenantId: { type: String, attribute: 'tenant-id' },
			orgUnitId: { type: String, attribute: 'org-unit-id' },
			topicId: { type: String, attribute: 'topic-id' },
			value: { type: String, reflect: true },
			filename: { type: String, reflect: true },

			_currentView: { type: Number, attribute: false },
			_errorMessage: { type: String, attribute: false },
			_fileName: { type: String, attribute: false },
			_fileSize: { type: Number, attribute: false },
			_fileType: { type: String, attribute: false },
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
	}

	async connectedCallback() {
		super.connectedCallback();

		const apiClient = new ContentServiceClient({
			endpoint: this.apiEndpoint,
			tenantId: this.tenantId,
			orgUnitId: this.orgUnitId
		});
		this.provideInstance('content-service-client', apiClient);

		const userBrightspaceClient = new UserBrightspaceClient();
		this.provideInstance('user-brightspace-client', userBrightspaceClient);

		this._uploader = new Uploader({
			apiClient,
			onSuccess: this.reactToUploadSuccess,
			onError: this.reactToUploadError
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
				view = html`
					<d2l-content-uploader-upload
						id="prompt-with-file-drop-enabled"
						error-message=${this._errorMessage}
						enable-file-drop
						@file-change=${this.onFileChange}
						@file-error=${this.onUploadError}>
					</d2l-content-uploader-upload>
					`;
				break;
			case VIEW.PREVIEW:
				view = html`
					<d2l-content-uploader-preview
						file-type=${this._fileType}
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
						upload-progress=${this._uploader.uploadProgress}>
					</d2l-content-uploader-progress>
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
					this._uploader.reset();
					this.onDiscardStagedFile();
				});
		}
	}

	onDiscardStagedFile() {
		this._file = undefined;
		this._fileName = '';
		this._fileSize = 0;
		this._fileType = '';
		this._currentView = VIEW.UPLOAD;
		this.updateValue('');
		this.topicId = '';
	}

	onFileChange(event) {
		this._file = event.detail.file;
		this._fileName = event.detail.file.name;
		this._fileSize = event.detail.file.size;
		this._fileType = event.detail.file.type;
		this._errorMessage = '';
		this.startUpload();
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
		this._errorMessage = this.localize(error);
		this._uploader.reset();
		this._file = undefined;
		this._fileName = '';
		this._fileSize = 0;
		this._fileType = '';
		this._currentView = VIEW.UPLOAD;
	}

	reactToUploadSuccess(value) {
		this.updateValue(value);
		this._currentView = VIEW.PREVIEW;
	}

	startUpload() {
		this._currentView = VIEW.PROGRESS;
		this._uploader.uploadFile(this._file, this._fileName, this._fileType);
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
		this.dispatchEvent(new Event('change', {
			bubbles: true,
			composed: true
		}));
	}
}

customElements.define('d2l-content-uploader', Main);
