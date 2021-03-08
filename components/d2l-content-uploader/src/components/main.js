import { css, html, LitElement } from 'lit-element/lit-element.js';
import ContentServiceClient from '../util/content-service-client';
import { DependencyProvider } from '../mixins/dependency-provider-mixin';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { Uploader } from '../state/uploader';
import '../../d2l-content-uploader';

const VIEW = Object.freeze({
	UPLOAD: 'UPLOAD',
	PREVIEW: 'PREVIEW',
	PROGRESS: 'PROGRESS',
	LOADING: 'LOADING'
});

export default class extends MobxReactionUpdate(DependencyProvider(LitElement)) {
	static get properties() {
		return {
			apiEndpoint: { type: String, attribute: 'api-endpoint' },
			tenantId: { type: String, attribute: 'tenant-id' },
			value: { type: String, reflect: true },

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
			tenantId: this.tenantId
		});
		this.provideDependency('content-service-client', apiClient);

		this._uploader = new Uploader({
			apiClient,
			onSuccess: this.reactToUploadSuccess,
			onError: this.reactToUploadError
		});

		if (this.value) {
			const resource = await apiClient.getRevisionByName(this.value);
			this._currentView = VIEW.PREVIEW;
			this._fileType = resource.type.toLowerCase();
			this._fileName = resource.title;
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
						file-name=${this._fileName}
						file-size=${this._fileSize}
						file-type=${this._fileType}
						@cancel=${this.onDiscardStagedFile}>
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
		this._uploader.uploadFile(this._file, this._fileName);
	}

	updateValue(value) {
		this.value = value;
		this.dispatchEvent(new Event('change', {
			bubbles: true,
			composed: true
		}));
	}
}
