import { html, LitElement } from 'lit-element';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';

import { S3Uploader } from '../util/s3-uploader.js';

class FileUploader extends DependencyRequester(LitElement) {
	async handleFilesAdded(event) {
		await Promise.all(event.detail.files.map(async (file) => {
			const content = await this.apiClient.createContent();
			const revision = await this.apiClient.createRevision(content.id, {
				type: 'Scorm',
				title: file.name,
				extension: file.extension,
			});
			const context = await this.apiClient.getUploadContext({
				contentId: content.id,
				revisionId: revision.id,
			});
			const uploader = new S3Uploader({
				file,
				key: context.key,
				signRequest: this.signRequest.bind(this),
			});
			const result = await uploader.upload();
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
		`;
	}
}

window.customElements.define('file-uploader', FileUploader);
