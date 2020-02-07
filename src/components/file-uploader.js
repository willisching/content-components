import { html, LitElement } from 'lit-element';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';

import { S3Uploader } from '../util/s3-uploader.js';

import '@brightspace-ui/core/components/meter/meter-linear.js';

class FileUploader extends DependencyRequester(LitElement) {
	static get properties() {
		return {
			uploading: { type: Boolean },
			progress: { type: Number }
		};
	}

	constructor() {
		super();
		this.progress = 0;
		this.uploading = false;
	}

	async handleFilesAdded(event) {
		await Promise.all(event.detail.files.map(async file => {
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
					this.progress = progress;
				},
				onComplete: () => {
					this.uploading = false;
				},
				onError: () => {
					this.uploading = false;
				}
			});
			this.uploading = true;
			await uploader.upload();
		}));
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

	render() {
		return html`
			<d2l-labs-file-uploader
				multiple
				@d2l-file-uploader-files-added=${this.handleFilesAdded}
			>
			</d2l-labs-file-uploader>
			${this.uploading ? html`<d2l-meter-linear value=${this.progress} max="100"></d2l-meter-linear>` : ''}
		`;
	}
}

window.customElements.define('file-uploader', FileUploader);
