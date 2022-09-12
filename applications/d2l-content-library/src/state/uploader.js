import { action, decorate, flow, observable, toJS } from 'mobx';

import { getType } from '../../../../util/media-type-util';
import resolveWorkerError from '../../../../util/resolve-worker-error.js';
import { S3Uploader } from '../../../../util/s3-uploader.js';

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
	constructor({ apiClient, isMultipart }) {
		this.nextUploadId = 0;
		this.uploads = [];
		this.apiClient = apiClient;
		this.isMultipart = isMultipart;
		this.uploadsInProgress = 0;
		this.uploadConcurrency = 5;
		this.statusWindowVisible = false;
		this.queuedUploads = [];
		this.runningJobs = 0;
		this._batch = 0;
		this.successfulUpload = {};

		this._monitorProgressCallback = this._monitorProgressCallback.bind(this);

		this.uploadFile = flow(function * (file, batch) {
			/* eslint-disable no-invalid-this */
			this.uploadsInProgress += 1;
			const uploadInfo = {
				id: this.nextUploadId,
				file,
				title: file.name,
				progress: 0,
				extension: file.name.split('.').pop(),
				err: null,
				batch
			};
			this.nextUploadId += 1;
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

		this.monitorNewUploadInfo = flow(function * (contentId, revisionId, extension) {
			/* eslint-disable no-invalid-this */
			this.uploadsInProgress += 1;

			let content;
			let revision;
			let loadError;
			try {
				content = yield this.apiClient.content.getItem({ id: contentId });
				revision = content.revisions.find(r => r.id === revisionId);
			} catch (error) {
				loadError = 'workerErrorUploadDataNotRetrieved';
			}

			const uploadInfo = {
				id: this.nextUploadId,
				file: null,
				title: content.title,
				progress: 0,
				extension,
				err: loadError ?? null,
				batch: this._batch
			};
			this.nextUploadId += 1;
			this.uploads.unshift(uploadInfo);

			if (!loadError) {
				yield this._monitorProgressAsync(uploadInfo.id, content, revision, this._monitorProgressCallback);
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

	monitorExistingUpload({ contentId, revisionId, extension }) {
		this.monitorNewUploadInfo(contentId, revisionId, extension);
		this.statusWindowVisible = true;
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
		uploadId,
		content,
		revision,
		progressCallback
	) {
		let err;
		try {
			const progress = await this.apiClient.content.getWorkflowProgress({
				id: content.id,
				revisionTag: revision.id
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
					uploadId,
					content,
					revision,
					error: err
				});
				try {
					await this.apiClient.content.deleteRevision({
						id: content.id,
						revisionTag: revision.id
					});
				} catch (error) {
					// Catch the error to delete here so that it doesn't fall through
				}

				return;
			}

			progressCallback({
				uploadId,
				content,
				revision,
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
					uploadId,
					contentId: content.id,
					revisionId: revision.id,
					error: err
				});
				return;
			}
		}

		await sleep(randomizeDelay(5000, 1000));
		await this._monitorProgressAsync(uploadId, content, revision, progressCallback);
	}

	async _monitorProgressCallback({ uploadId, content, revision, percentComplete = 0, ready, error }) {
		const upload = this.uploads.find(
			upload => upload.id === uploadId
		);
		if (upload) {
			upload.progress = 50 + (percentComplete / 2);
			upload.error = error;
		}

		if (ready && upload.progress === 100) {
			let poster;
			try {
				poster = (await this.apiClient.content.getResource({
					id: content.id,
					revisionTag: revision.id,
					resource: 'poster',
					outputFormat: 'signed-url'
				})).value;
			} catch (error) {
				// Ignore if the poster can't be retrieved. An icon will be shown instead of the poster image.
			}
			this.successfulUpload = { upload, content, revision, poster };
			this.uploadsInProgress -= 1;
		}
	}

	async _uploadWorkflowAsync({ id: uploadId, file, extension }) {
		const type = getType(file.name);
		try {
			this.runningJobs += 1;
			const content = await this.apiClient.content.postItem({
				content: {
					title: file.name,
					clientApp: 'LmsCapture',
					type
				}
			});
			const revision = await this.apiClient.content.createRevision({
				id: content.id,
				properties: {
					extension,
				}
			});
			const contentId = content.id;
			const revisionId = revision.id;

			const uploader = new S3Uploader({
				file,
				key: revision.s3Key,
				isMultipart: this.isMultipart,
				signRequest: ({ file, key }) =>
					this.apiClient.s3Sign.sign({
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
				},
				abortMultipartUpload: async({uploadId}) => this.apiClient.content.abortMultipartUpload({uploadId, contentId, revisionId}),
				batchSign: async({uploadId, numParts}) => this.apiClient.content.batchSign({uploadId, numParts, contentId, revisionId}),
				completeMultipartUpload: async({uploadId, parts}) => this.apiClient.content.completeMultipartUpload({uploadId, parts, contentId, revisionId}),
				createMultipartUpload: async() => this.apiClient.content.initializeMultipartUpload({contentId, revisionId})
			});
			await uploader.upload();
			await this.apiClient.content.startWorkflow({
				id: content.id,
				revisionTag: revision.id
			});
			await this._monitorProgressAsync(uploadId, content, revision, this._monitorProgressCallback);
		} catch (error) {
			const upload = this.uploads.find(
				upload => upload.id === uploadId
			);
			upload.error = resolveWorkerError(error, type);
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
