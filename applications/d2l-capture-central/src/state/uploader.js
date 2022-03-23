import { action, decorate, flow, observable, toJS } from 'mobx';

import resolveWorkerError from '../util/resolve-worker-error.js';
import { S3Uploader } from '../util/s3-uploader.js';

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
		this.uploadConcurrency = 5;
		this.statusWindowVisible = false;
		this.queuedUploads = [];
		this.runningJobs = 0;
		this._batch = 0;
		this.successfulUpload = {};

		this.uploadFile = flow(function * (file, batch) {
			/* eslint-disable no-invalid-this */
			this.uploadsInProgress += 1;
			const uploadInfo = { file, progress: 0, extension: file.name.split('.').pop(), err: null, batch };
			let count = 0;
			this.uploads.forEach(ui => {
				if (ui.batch === batch) {
					count += 1;
				}
			});
			this.uploads.splice(count, 0, uploadInfo);
			try {
				if (this.runningJobs < this.uploadConcurrency) {
					yield this._uploadWorkflowAsync(uploadInfo);
				} else {
					this.queuedUploads.push(uploadInfo);
				}
			} catch (error) {
				const upload = this.uploads.find(
					upload => upload.file === uploadInfo.file
				);
				upload.error = resolveWorkerError(error);
			}
			/* eslint-enable no-invalid-this */
		});
	}

	clearCompletedUploads() {
		this.uploads = this.uploads.filter(upload => upload.progress !== 100 && !upload.error);
	}

	getSuccessfulUpload() {
		return toJS(this.successfulUpload);
	}

	getUploads() {
		return toJS(this.uploads);
	}

	showStatusWindow(show) {
		this.statusWindowVisible = show;
	}

	uploadFiles(files) {
		this._batch += 1;
		for (const file of files) {
			this.uploadFile(file, this._batch);
		}

		if (files.length > 0) {
			this.statusWindowVisible = true;
		}
	}

	async _monitorProgressAsync(
		content,
		revision,
		progressCallback
	) {
		let err;
		try {
			const progress = await this.apiClient.getWorkflowProgress({
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
				try {
					await this.apiClient.deleteRevision({
						contentId: content.id,
						revisionId: revision.id
					});
				} catch (error) {
					// Catch the error to delete here so that it doesn't fall through
				}

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

		await sleep(randomizeDelay(5000, 1000));
		await this._monitorProgressAsync(content, revision, progressCallback);
	}

	async _uploadWorkflowAsync({ file, extension }) {
		try {
			this.runningJobs += 1;
			const content = await this.apiClient.createContent({
				title: file.name,
				clientApp: 'LmsCapture',
			});
			const revision = await this.apiClient.createRevision({
				contentId: content.id,
				body: {
					extension,
					formats: ['hd', 'sd'],
				}
			});
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
			await uploader.upload();
			await this.apiClient.processRevision({
				contentId: content.id,
				revisionId: revision.id
			});
			await this._monitorProgressAsync(content, revision, async({ percentComplete = 0, ready, error }) => {
				const upload = this.uploads.find(
					upload => upload.file === file
				);
				if (upload) {
					upload.progress = 50 + (percentComplete / 2);
					upload.error = error;
				}

				if (ready && upload.progress === 100) {
					let thumbnail;
					try {
						thumbnail = (await this.apiClient.getPoster({ contentId: content.id, revisionId: revision.id })).value;
					} catch (error) {
						// Ignore if the thumbnail can't be retrieved. An icon will be shown instead of the thumbnail image.
					}
					this.successfulUpload = { upload, content, revision, thumbnail };
				}
			});
		} catch (error) {
			const upload = this.uploads.find(
				upload => upload.file === file
			);
			upload.error = resolveWorkerError(error);
		} finally {
			this.runningJobs -= 1;
			this.uploadsInProgress -= 1;
			if (this.queuedUploads.length > 0) {
				await this._uploadWorkflowAsync(this.queuedUploads.shift());
			}
		}
	}
}

decorate(Uploader, {
	uploads: observable,
	uploadsInProgress: observable,
	statusWindowVisible: observable,
	successfulUpload: observable,
	getUploads: action,
	uploadFile: action,
	uploadFiles: action,
	clearCompletedUploads: action
});
