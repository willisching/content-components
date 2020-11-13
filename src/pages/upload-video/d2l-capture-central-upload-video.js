import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui-labs/file-uploader/d2l-file-uploader.js';
import '@brightspace-ui/core/components/meter/meter-linear.js';

import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles, labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { inputStyles } from '@brightspace-ui/core/components/inputs/input-styles.js';
import { PageViewElement } from '../../components/page-view-element.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { sharedEditStyles } from '../../style/shared-styles.js';

class D2LCaptureUploadVideo extends DependencyRequester(PageViewElement) {
	static get properties() {
		return {
			_content: { type: Object },
			_editingProperties: { type: Boolean },
			_fileUploadCompleted: { type: Boolean },
			_fileUploadStarted: { type: Boolean },
			_revision: { type: Object },
			_uploadError: { type: Boolean },
			_uploadFeedback: { type: String },
			_uploadedVideo: { type: Object },
		};
	}

	static get styles() {
		return [inputStyles, heading2Styles, labelStyles, selectStyles, sharedEditStyles, css`
			.d2l-capture-central-edit-presentation-options {
				margin: 10px 0;
			}
			.d2l-capture-central-edit-presentation-options d2l-icon {
				color: var(--d2l-color-celestine);
				margin-bottom: 5px;
				margin-right: 5px;
			}

			.d2l-capture-central-upload-video-guidelines {
				margin-bottom: 20px;
			}

			#d2l-capture-central-upload-video-uploader {
				margin: 20px auto;
				width: 50%;
			}

			.d2l-capture-central-upload-video-upload-status,
			.d2l-capture-central-upload-video-failed-message {
				margin-left: auto;
				margin-right: auto;
			}

			.d2l-capture-central-upload-video-button-group {
				display: flex;
				margin: 0 auto;
			}

			.d2l-capture-central-upload-video-edit-properties-button {
				margin-left: 20px;
			}

			d2l-meter-linear {
				margin: auto;
				margin-bottom: 20px;
				max-width: 25rem;
				width: 50%;
			}

			.d2l-capture-central-upload-video-failed-message {
				color: var(--d2l-color-feedback-error);
				display: flex;
				margin-bottom: 20px;
			}

			.d2l-capture-central-upload-video-guidelines div {
				margin-bottom: 20px;
			}
		`];
	}

	constructor() {
		super();
		this._folders = [{ name: 'None', }, { name: 'Folder 1', }];

		this.codec = 'h.264';
		this.formats = '.mp4, .flv, .f4v, .m4v, .mov';
		this.bitrate = '150-4000 kbps';

		this._fileUploadStarted = false;
		this._editingProperties = false;
	}

	get _uploadError() {
		return this._fileUploadStarted
			&& this.uploader.uploads.some(upload => upload.error);
	}

	get _fileUploadCompleted() {
		return this._fileUploadStarted
			&& this.uploader.uploadsInProgress === 0
			&& this.uploader.uploads.every(upload => !upload.error);
	}

	connectedCallback() {
		super.connectedCallback();
		this.uploader = this.requestDependency('uploader');
		this.apiClient = this.requestDependency('content-service-client');
	}

	_finishUpload() {
		const title = this.shadowRoot.querySelector('#d2l-capture-central-edit-file-title').value;
		const {content} = this.uploader.getSuccessfulUpload();
		const body = Object.assign({}, content, {
			title,
		});
		this.apiClient.updateContent({
			id: content.id,
			body
		});
		this._resetUploadState() && this._navigate('/admin');
	}

	_handleFileAdded({ detail: { files }}) {
		const [file] = files;
		const fileUploader = this.shadowRoot.querySelector('d2l-labs-file-uploader');
		if (file.type.split('/')[0] !== 'video') {
			fileUploader.setAttribute('feedback', this.localize('invalidFileType'));
			fileUploader.setAttribute('feedback-type', 'error');
			return;
		}
		fileUploader.removeAttribute('feedback');
		fileUploader.removeAttribute('feedback-type');

		this.uploader.uploadFiles(files);
		this._fileUploadStarted = true;
		this._uploadedVideo = file;
	}

	_setEditingProperties(val) {
		return () => this._editingProperties = val;
	}

	_resetUploadState() {
		this.uploader.clearCompletedUploads();
		this._uploadedVideo = null;
		this._fileUploadStarted = false;
		this._editingProperties = false;
	}

	_renderBreadcrumbs() {
		const uploadBreadcrumbs = this._editingProperties
			? html`
				<d2l-breadcrumb @click=${this._resetUploadState} href="#" text="${this.localize('uploadVideo')}"></d2l-breadcrumb>
				<d2l-breadcrumb-current-page text="${this.localize('editProperties')}"></d2l-breadcrumb-current-page>
			  `
			: html`<d2l-breadcrumb-current-page text="${this.localize('uploadVideo')}"></d2l-breadcrumb-current-page>`;

		return html`
			<d2l-breadcrumbs>
				<d2l-breadcrumb @click=${this._goTo('/admin')} href="#" text="${this.localize('captureCentral')}"></d2l-breadcrumb>
				${this.rootStore.routingStore.previousPage === 'presentations' ? html`
					<d2l-breadcrumb @click=${this._goTo('/presentations')} href="#" text="${this.localize('presentations')}">
					</d2l-breadcrumb>` : ''}
				${uploadBreadcrumbs}
			</d2l-breadcrumbs>
		`;
	}

	_renderEditProperties() {
		return html`
			<div class="d2l-heading-2">${this.localize('editProperties')}</div>
			<d2l-input-text
				id="d2l-capture-central-edit-file-title"
				label="${this.localize('title')}"
				placeholder="${this.localize('title')}"
				value=${this._uploadedVideo.name}
			></d2l-input-text>
			<div class="d2l-capture-central-manage-header-button-group">
				<d2l-button
					@click=${this._finishUpload}
					class="d2l-capture-central-edit-save-changes-button"
					primary
				>${this.localize('finish')}
				</d2l-button>
			</div>
		`;
	}

	_renderProgress() {
		if (!this._fileUploadStarted || this._fileUploadCompleted) {
			return;
		}
		const renderUploadError = ({ error }) => html`
			<div class="d2l-capture-central-upload-video-failed-message">
				${this.localize(error)}
			</div>
		`;

		const renderUploadProgress = ({ progress }) => html`
			<d2l-meter-linear text-inline value=${progress} max="100" percent></d2l-meter-linear>
		`;

		return this.uploader.uploads.map(upload => (upload.error
			? renderUploadError(upload)
			: renderUploadProgress(upload)
		));
	}

	_renderUploadVideo() {
		const { codec, formats, bitrate } = this;
		let uploadStatus = '';
		if (this._fileUploadCompleted) {
			uploadStatus = 'uploadCompleted';
		} else if (this._fileUploadStarted) {
			uploadStatus = this._uploadError
				? 'uploadError'
				: 'uploadInProgress';
		}
		return html`
			<div class="d2l-heading-2">${this.localize('uploadVideo')}</div>
			<d2l-labs-file-uploader
				style="${this._fileUploadStarted ? 'display: none' : ''}"
				@d2l-file-uploader-files-added=${this._handleFileAdded}
				id="d2l-capture-central-upload-video-uploader"
			></d2l-labs-file-uploader>
			<div
				?hidden="${!uploadStatus}"
				class="d2l-heading-2 d2l-capture-central-upload-video-upload-status"
			>${this.localize(uploadStatus)}
			</div>
			${this._renderProgress()}
			<div class="d2l-capture-central-upload-video-button-group">
				<d2l-button ?hidden=${!this._fileUploadCompleted && !this._uploadError} @click=${this._resetUploadState}>
					${this.localize(this._uploadError ? 'tryAgain' : 'uploadAnother')}
				</d2l-button>
				<d2l-button
					primary
					@click=${this._setEditingProperties(true)}
					class="d2l-capture-central-upload-video-edit-properties-button"
					?hidden=${!this._fileUploadCompleted}
				>${this.localize('editProperties')}
				</d2l-button>
			</div>
			<div ?hidden="${this._fileUploadStarted}">
				<div>${this.localize('uploadVideoNonCaptureGuideline')}</div>
				<ul>
					<li>${this.localize('uploadVideoCodecGuideline', { codec })}</li>
					<li>${this.localize('uploadVideoFormatsGuideline', { formats })}</li>
					<li>${this.localize('uploadVideoBitrateGuideline', { bitrate })}</li>
					<li>${this.localize('uploadVideoInsufficientBandwidthGuideline')}</li>
				</ul>
			</div>
		`;
	}

	render() {
		return html`
			<div class="d2l-capture-central-edit-container">
				${this._renderBreadcrumbs()}
				${this._editingProperties ? this._renderEditProperties() : this._renderUploadVideo()}
			</div>
		`;
	}
}

window.customElements.define('d2l-capture-central-upload-video', D2LCaptureUploadVideo);
