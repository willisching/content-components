import { LitElement } from 'lit-element';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';

import { S3Uploader } from '../util/s3-uploader.js';

import '@brightspace-ui/core/components/meter/meter-linear.js';

class FileUploader extends DependencyRequester(LitElement) {
	static get properties() {
		return {
			_uploads: { type: Array }
		};
	}

	constructor() {
		super();
		this._uploads = [];
	}

	async uploadFile(file) {
		const content = await this.apiClient.createContent();
		const revision = await this.apiClient.createRevision(content.id, {
			type: 'Scorm',
			title: file.name,
			extension: file.extension
		});
		const uploader = new S3Uploader({
			file,
			key: revision.s3Key,
			signRequest: this.signRequest.bind(this),
			onProgress: progress => {
				const upload = this._uploads.find(item => item.file === file);
				upload.progress = progress;
			},
			onComplete: () => {
				this._uploads = this._uploads.filter(item => item.file !== file);
				this.dispatchEvent(new CustomEvent('upload-completed', {
					detail: { file },
					bubbles: true,
					cancelable: true,
					composed: true
				}));
			},
			onError: () => {
				this.uploading = false;
			}
		});
		await uploader.upload();
	}

	enqueueFiles(files) {
		const uploads = files.map(file => {
			return {
				file,
				progress: 0,
				promise: this.uploadFile(file)
			};
		});

		this._uploads = this._uploads.concat(uploads);
	}

	async signRequest({ file, key }) {
		const result = await this.apiClient.signUploadRequest({
			fileName: key,
			contentType: file.type,
			contentDisposition: 'auto'
		});
		return result;
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
	}
}

window.customElements.define('file-uploader', FileUploader);
