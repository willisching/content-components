import { decorate, observable, action, flow } from 'mobx';

import { S3Uploader } from '../util/s3-uploader.js';
import resolveWorkerError from '../util/resolve-worker-error.js';

const randomizeDelay = (delay = 30000, range = 5000) => {
	const low = delay - range;
	const random = Math.round(Math.random() * range * 2);
	return low + random;
};

const sleep = async(delay = 0) => {
	await new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, delay);
	});
};

export class Uploader {
	constructor({ apiClient }) {
		this.uploads = [];
		this.apiClient = apiClient;
		this.uploadsInProgress = 0;
		this.statusWindowVisible = false;

		this.uploadFile = flow(function * (file) {
			/* eslint-disable no-invalid-this */
			this.uploadsInProgress++;

			const monitorProgress = function * (
				content,
				revision,
				progressCallback
			) {
				let err;
				try {
					const progress = yield this.apiClient.getWorkflowProgress({
						contentId: content.id,
						revisionId: revision.id
					});
					if (progress.didFail) {
						try {
							err = resolveWorkerError(
								JSON.parse(progress.details)
							);
						} catch (error) {
							err = resolveWorkerError(error);
						}

						progressCallback({
							contentId: content.id,
							revisionId: revision.id,
							error: err
						});
						yield this.apiClient
							.deleteRevision({
								contentId: content.id,
								revisionId: revision.id
							})
							.catch(() => null); // Catch the error to delete here so that it doesn't fall through
						return;
					}

					progressCallback({
						contentId: content.id,
						revisionId: revision.id,
						percentComplete: progress.percentComplete,
						ready: progress.ready
					});
					if (progress.ready) {
						return;
					}
				} catch (error) {
					if (error.status && error.status === 404) {
						err = resolveWorkerError(error);
						progressCallback({
							contentId: content.id,
							revisionId: revision.id,
							error: err
						});
						return;
					}
				}

				yield sleep(randomizeDelay(5000, 1000));
				yield * monitorProgress(content, revision, progressCallback);
			}.bind(this);
			try {
				const extension = file.name.split('.').pop();
				this.uploads.push({ file, progress: 0, extension, err: null });
				const content = yield this.apiClient.createContent();
				const revision = yield this.apiClient.createRevision(
					content.id,
					{
						title: file.name,
						extension
					}
				);
				const uploader = new S3Uploader({
					file,
					key: revision.s3Key,
					signRequest: ({ file, key }) =>
						this.apiClient.signUploadRequest({
							fileName: key,
							contentType: file.type,
							contentDisposition: 'auto'
						}),
					onProgress: progress => {
						const upload = this.uploads.find(
							upload => upload.file === file
						);
						if (upload) {
							upload.progress = progress / 2;
						}
					}
				});
				yield uploader.upload();
				yield this.apiClient.processRevision({
					contentId: content.id,
					revisionId: revision.id
				});
				yield * monitorProgress(content, revision, ({ percentComplete, error }) => {
					const upload = this.uploads.find(
						upload => upload.file === file
					);
					if (upload) {
						upload.progress = 50 + (percentComplete / 2);
						upload.error = error;
					}
				});
			} catch (error) {
				const upload = this.uploads.find(
					upload => upload.file === file
				);
				upload.error = resolveWorkerError(error);
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
