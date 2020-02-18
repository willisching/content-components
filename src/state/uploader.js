import { decorate, observable, action, flow } from 'mobx';

import { S3Uploader } from '../util/s3-uploader.js';

export class Uploader {
	constructor({ apiClient }) {
		this.uploads = [];
		this.apiClient = apiClient;
	}

	getUploads() {
		return this.uploads;
	}

	uploadFile = flow(function * (file) {
		/* eslint-disable no-invalid-this */
		this.uploads.push({ file, progress: 0 });
		const content = yield this.apiClient.createContent();
		const revision = yield this.apiClient.createRevision(content.id, {
			type: 'Scorm',
			title: file.name,
			extension: file.extension
		});
		const uploader = new S3Uploader({
			file,
			key: revision.s3Key,
			signRequest: ({ file, key }) => this.apiClient.signUploadRequest({
				fileName: key,
				contentType: file.type,
				contentDisposition: 'auto'
			}),
			onProgress: progress => {
				const upload = this.uploads.find(upload => upload.file === file);
				if (upload) {
					upload.progress = progress;
				}
			}
		});
		yield uploader.upload();
		this.uploads = this.uploads.filter(upload => upload.file !== file);
		/* eslint-enable no-invalid-this */
	})
}

decorate(Uploader, {
	uploads: observable,
	getUploads: action,
	addUpload: action
});
