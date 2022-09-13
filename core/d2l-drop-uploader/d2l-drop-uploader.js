import 'file-drop-element';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-checkbox.js';
import { formatFileSize } from '@brightspace-ui/intl/lib/fileSize.js';
import { bodyCompactStyles, bodySmallStyles, bodyStandardStyles, heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { inputLabelStyles } from '@brightspace-ui/core/components/inputs/input-label-styles.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import { css, html, LitElement } from 'lit-element';
import { RequesterMixin } from '@brightspace-ui/core/mixins/provider-mixin.js';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { isSupported, getSupportedExtensions } from '../../util/media-type-util.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { Uploader } from '../../util/uploader.js';

export class Upload extends RtlMixin(RequesterMixin(InternalLocalizeMixin(LitElement))) {
	static get properties() {
		return {
			tenantId: { type: String, attribute: 'tenant-id' },
			apiEndpoint: { type: String, attribute: 'api-endpoint' },
			errorMessage: { type: String, attribute: 'error-message', reflect: true },
			maxFileSizeInBytes: { type: Number, attribute: 'max-file-size' },
			enableBulkUpload: { type: Boolean, attribute: 'enable-bulk-upload' },
			existingContentId: { type: String, attribute: 'existing-content-id' },
			sharingOrgUnitId: { type: String, attribute: 'sharing-org-unit-id' },
			shareUploadsWith: { type: Array, attribute: 'share-uploads-with' },
			allowAsyncProcessing: { type: Boolean },
			supportedTypes: { type: Array },
			videoAudioDisplay: { type: Boolean },
			isMultipart: { type: Boolean, attribute: 'is-multipart' }
		};
	}

	static get styles() {
		return [bodySmallStyles,
			bodyStandardStyles,
			heading2Styles,
			bodyCompactStyles,
			selectStyles,
			inputLabelStyles,
			css`
			file-drop {
				display: block;
				border: 2px dashed var(--d2l-color-corundum);
			}
			.ui-generic file-drop {
				margin-top: 10px;
				border: 2px dashed var(--d2l-color-tungsten);
				border-radius: 7px;
			}
			@media screen and (max-width: 480px) {
				#no-file-drop-container {
					display: block;
					padding: 30vh 20px 10px 20px;
				}
			}
			@media screen and (min-width: 481px) {
				#no-file-drop-container {
					display: block;
					padding: 8vh 20px 10px 20px;
				}
			}
			file-drop.drop-valid {
				background-color: var(--d2l-color-gypsum);
				border: 2px dashed var(--d2l-color-feedback-action);
			}
			file-drop.drop-invalid {
				background-color: var(--d2l-color-gypsum);
				border: 2px dashed var(--d2l-color-feedback-error);
			}
			.file-drop-content-container {
				text-align: center;
				margin: 1.5rem;
			}
			.d2l-file-uploader-browse-label{
				cursor: pointer;
			}
			d2l-icon {
				height: 60px;
				width: 60px;
				margin: 10px;
				color: $d2l-color-ferrite;
			  }
			.file-uploader-background {
				display: flex;
				align-items: center;
				justify-content: center;
				flex-direction: column;
				text-align: center;
				width: 100%;
				height: 250px;
				font-size: 20px;
			  }
			#file-select {
				display: none;
			}
			#file-size-limit {
				margin-top: 20px;
			}
			#error-message {
				color: var(--d2l-color-feedback-error);
			}
			#file-max {
				font-size: 14px;
			}
			.upload-container {
				display: flex;
				flex-direction: column;
			}
			.upload-options-container {
				height: 0px;
				padding-top: 0.5rem;
			}
			table {
				border-collapse: collapse;
			}
			.file-limit-message {
				margin-block-end: 0;
			}
			.ui-generic .file-limit-message {
				font-size: 14px;
			}
		`];
	}

	preprocess = async file => {
		if (file.size === 0) {
			return;
		}
		/* eslint-disable no-invalid-this */
		const workflow = () => {
			// remove extention for package name in property only
			const fileName = file.name && file.name.slice(0, file.name.lastIndexOf('.'));
			this.dispatchEvent(new CustomEvent('bulk-upload-details', {
				detail: {
					fileName: file.name,
					totalFiles: this.files.length,
					progress: this.progress,
				},
			}));
			this.uploader.uploadFile(file, fileName, file.type, this.files.length)
				.then(() => {
					this.progress += 1;
				});
		};
		this.uploadQueue.push(workflow);
		/* eslint-enable no-invalid-this */
	};

	constructor() {
		super();
		this._maxNumberOfFiles = 50;
		this.reactToUploaderError = this.reactToUploaderError.bind(this);
		this.reactToUploadingSuccess = this.reactToUploadingSuccess.bind(this);
		this.reactToProcessingSuccess = this.reactToProcessingSuccess.bind(this);
		this.onProgress = this.onProgress.bind(this);
		this.uploadQueue = [];
		this.files = [];
		this.progress = 0;
		this.active = 0;
	}

	async connectedCallback() {
		super.connectedCallback();
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.apiEndpoint });
		this.apiClient = new ContentServiceApiClient({
			tenantId: this.tenantId,
			httpClient,
			contextType: 'sharingOrgUnit',
			contextId: this.sharingOrgUnitId
		});
		this._initUploader();
	}

	render() {
		return html`
			<div class="upload-container">
				${this.videoAudioDisplay ? this._renderVideoAudioUI() : this._renderGenericUI()}
			</div>`;
	}

	updated(changedProperties) {
		super.updated(changedProperties);

		if (changedProperties.has('existingContentId')) {
			this._initUploader();
		}
	}

	cancelUpload() {
		// clear pending queue before cancelling active uploads
		this.uploadQueue = [];
		this.uploader.cancelUpload();
	}

	onBrowseClick() {
		this.shadowRoot.querySelector('#file-select').click();
	}

	onFileDrop(event) {
		this.processFiles(event.files);
	}

	onFileInputChange(event) {
		this.processFiles(event.target.files);
	}

	onProgress(progress) {
		this.dispatchEvent(new CustomEvent('on-progress', {
			detail: {
				progress,
			},
		}));
	}

	onUploadError(message) {
		this.dispatchEvent(new CustomEvent('on-uploader-error', {
			detail: {
				view: 'UPLOAD',
				fileName: null,
				errorMessage: message,
			},
		}));
	}

	preupload() {
		this.reset();
		this.dispatchEvent(new CustomEvent('preupload-reset'));
		this.dispatchEvent(new CustomEvent('change-view', {
			detail: {
				view: 'PROGRESS',
				fileName: this.files[0].name,
				errorMessage: null,
			},
		}));
	}

	processFiles(files) {
		this.files = Array.from(files);
		if (this.files.length !== 1 && !this.enableBulkUpload) {
			return this.onUploadError(this.localize('mayOnlyUpload1File'));
		}

		if (this.enableBulkUpload && this.files.length > this._maxNumberOfFiles) {
			return this.onUploadError(this.localize('tooManyFiles'));
		}

		if (this.files.some(file => !isSupported(file.name, this.supportedTypes))) {
			return this.onUploadError(this.localize('invalidFileType'));
		}

		if (this.files.some(file => file.size > this.maxFileSizeInBytes || file.size === 0)) {
			return this.onUploadError(this.localize('invalidFileSize', { localizedMaxFileSize: formatFileSize(this.maxFileSizeInBytes) }));
		}

		for (const file of this.files) {
			this.preprocess(file);
		}

		// on file select cancel (0 files selected), should not proceed with upload steps
		if (this.files.length !== 0) {
			this.preupload();
			this.startUpload();
		}

	}

	reactToProcessingSuccess(value) {
		this.dispatchEvent(new CustomEvent('on-uploader-success', {
			detail: {
				d2lrn: value,
			},
		}));
	}

	reactToUploaderError(error, contentTitle) {
		this.active -= 1;
		this.startUpload();
		this.dispatchEvent(new CustomEvent('on-uploader-error', {
			detail: {
				fileName: contentTitle,
				errorMessage: this.localize(error),
			},
		}));
	}

	reactToUploadingSuccess(value) {
		this.active -= 1;
		this.startUpload();
		if (this.allowAsyncProcessing) {
			this.dispatchEvent(new CustomEvent('on-uploader-success', {
				detail: {
					d2lrn: value,
				},
			}));
		}
	}

	reset() {
		// reset uploader from any previous state before upload, if any
		this.uploader.reset();
		this.active = 0;
		this.progress = 0;
		this.errorMessage = null;
		// reset upload progress loading bar to 0
		this.onProgress(this.progress);
	}

	startUpload() {
		while (this.active < 5 && this.uploadQueue.length > 0) {
			this.active += 1;
			this.uploadQueue.pop()();
		}
	}

	_initUploader() {
		this.uploader = new Uploader({
			apiClient: this.apiClient,
			onSuccess: this.reactToProcessingSuccess,
			onError: this.reactToUploaderError,
			waitForProcessing: !this.allowAsyncProcessing,
			onProgress: this.onProgress,
			existingContentId: this.existingContentId,
			onUploadFinish: this.reactToUploadingSuccess,
			shareUploadsWith: this.shareUploadsWith,
			isMultipart: this.isMultipart
		});
	}

	_isBulkUploadEnabled() {
		return this.enableBulkUpload && !this.existingContentId;
	}

	_renderGenericUI() {
		return html`
			<div class="ui-generic">
				<label class="d2l-file-uploader-browse-label">
					<file-drop @filedrop=${this.onFileDrop} ?multiple=${this._isBulkUploadEnabled()}>
						<input
							id="file-select"
							type="file"
							accept=${getSupportedExtensions(this.supportedTypes).toString()}
							@change=${this.onFileInputChange}
							?multiple=${this._isBulkUploadEnabled()}
						/>
						<div class="file-uploader-background">
							<d2l-icon icon="d2l-tier2:upload"></d2l-icon>
							<div>${this.localize('dropFilesOrClick')}</div>
						${this.errorMessage ? html`<p id="error-message" class="d2l-body-compact">${this.errorMessage}&nbsp;</p>` : ''}
						</div>
					</file-drop>
				</label>
				${this._isBulkUploadEnabled() ? html`<p class="file-limit-message">
					${this.localize('maxNumberOfFiles', { _maxNumberOfFiles: this._maxNumberOfFiles })}
				</p>` : ''}
			</div>
		`;
	}

	_renderVideoAudioUI() {
		return html`
			<div class="ui-videoaudio">
				<file-drop @filedrop=${this.onFileDrop} ?multiple=${this._isBulkUploadEnabled()}>
					<div class="file-drop-content-container">
						<h2 class="d2l-heading-2">${this.localize('dropAudioVideoFile')}</h2>
						<p class="d2l-body-standard">${this.localize('or')}</p>
						<d2l-button
							description=${this.localize('browseForFile')}
							@click=${this.onBrowseClick}
						>
							${this.localize('browse')}
							<input
								id="file-select"
								type="file"
								accept=${getSupportedExtensions(this.supportedTypes).toString()}
								@change=${this.onFileInputChange}
								?multiple=${this._isBulkUploadEnabled()}
							/>
						</d2l-button>
						${this.errorMessage ? html`<p id="error-message" class="d2l-body-compact">${this.errorMessage}&nbsp;</p>` : ''}
					</div>
				</file-drop>
				<p class="file-limit-message">${this._isBulkUploadEnabled() ? this.localize('maxNumberOfFiles', { _maxNumberOfFiles: this._maxNumberOfFiles }) : this.localize('fileSizeLimitMessage', { localizedMaxFileSize: formatFileSize(this.maxFileSizeInBytes) })}</p>
			</div>
		`;
	}
}

customElements.define('d2l-drop-uploader', Upload);
