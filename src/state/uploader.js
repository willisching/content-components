import { decorate, observable, action, flow } from 'mobx';

import { S3Uploader } from '../util/s3-uploader.js';

export class Uploader {
	constructor({ apiClient }) {
		this.uploads = [];
		this.apiClient = apiClient;
		this.uploadsInProgress = 0;
		this.statusWindowVisible = false;

		this.uploadFile = flow(function * (file) {
			/* eslint-disable no-invalid-this */
			this.uploadsInProgress++;
			try {
				const extension = file.name.split('.').pop();
				this.uploads.push({ file, progress: 0, extension, err: null });
				const content = yield this.apiClient.createContent();
				const revision = yield this.apiClient.createRevision(content.id, {
					title: file.name,
					extension
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
				yield this.apiClient.processRevision({ contentId: content.id, revisionId: revision.id });
			} catch (error) {
				const upload = this.uploads.find(upload => upload.file === file);
				upload.error = error;
			} finally {
				this.uploadsInProgress--;
			}
			/* eslint-enable no-invalid-this */
		});
	}

	uploadFiles(files) {
		for (const file of files) {
			this.uploadFile(file);
		}

		if (files.length > 0) {
			this.statusWindowVisible = true;
		}
	}

	getUploads() {
		return this.uploads;
	}

	clearCompletedUploads() {
		this.uploads = this.uploads.filter(upload => upload.progress !== 100 && !upload.error);
	}

	showStatusWindow(show) {
		this.statusWindowVisible = show;
	}
}

decorate(Uploader, {
	uploads: observable,
	uploadsInProgress: observable,
	statusWindowVisible: observable,
	getUploads: action,
	showStatusWindow: action,
	uploadFile: action,
	uploadFiles: action,
	clearCompletedUploads: action
});
