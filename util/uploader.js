import { action, decorate, flow, observable } from 'mobx';
import resolveWorkerError from './resolve-worker-error.js';
import { S3Uploader } from './s3-uploader.js';
import { randomizeDelay, sleep } from './delay.js';
import { getExtension, isAudioType, isVideoType, getType } from './media-type-util.js';

const UPLOAD_FAILED_ERROR = 'workerErrorUploadFailed';

/* eslint-disable no-unused-vars */
export class Uploader {
	constructor({ apiClient, onSuccess, onError, waitForProcessing, existingContentId, onProgress = progress => {} }) {
		/* eslint-enable no-unused-vars */
		this.apiClient = apiClient;
		this.onSuccess = onSuccess;
		this.onError = onError;
		this.waitForProcessing = waitForProcessing;
		this.existingContentId = existingContentId;
		this.onProgress = onProgress;
		this.uploadProgress = 0;
		this.lastProgressPosition = 0;
		this.totalFiles = 1;

		/* eslint-disable no-invalid-this */
		this.uploadFile = flow((function * (file, title, fileType, totalFiles = 1) {
			yield this._uploadWorkflowAsync(file, title, totalFiles);
		}));
		/* eslint-enable no-invalid-this */
	}

	async cancelUpload() {
		if (this.content && this.s3Uploader) {
			this.s3Uploader.abort();
			await this.apiClient.content.deleteItem({ id: this.content.id });
		}
	}

	reset() {
		this.uploadProgress = 0;
		this.content = undefined;
		this.revision = undefined;
		this.s3Uploader = undefined;
	}

	async _monitorProgressAsync() {
		// Stop monitoring if the upload was cancelled.
		if (!this.content || !this.revision) {
			return;
		}

		try {
			const progress = await this.apiClient.content.getWorkflowProgress({
				id: this.content.id,
				revisionTag: this.revision.id,
			});
			this.uploadProgress = this.lastProgressPosition + ((50 + ((progress.percentComplete || 0) / 2)) / this.totalFiles);
			this.onProgress(this.uploadProgress);
			if (progress.ready) {
				this.onSuccess(this.revision.d2lrn);
				this.s3Uploader = undefined;
				return;
			}

			if (progress.didFail) {
				this.onError(UPLOAD_FAILED_ERROR);
				this.s3Uploader = undefined;
				return;
			}
		} catch (error) {
			if (error.cause > 399 && error.cause < 500) {
				this.onError(resolveWorkerError(error));
				this.s3Uploader = undefined;
				return;
			}
		}

		await sleep(randomizeDelay(5000, 1000));
		await this._monitorProgressAsync(this.content, this.revision);
	}

	async _uploadWorkflowAsync(file, title, totalFiles) {
		const type = getType(file.name);
		try {
			this.totalFiles = totalFiles;
			const extension = getExtension(file.name);
			const createContentBody = {
				title,
				type,
			};

			if (isAudioType(file.name) || isVideoType(file.name)) {
				createContentBody.clientApp = 'LmsContent';
			}

			this.content = this.existingContentId ?
				await this.apiClient.content.updateItem({ content: { id: this.existingContentId, title } }) :
				await this.apiClient.content.postItem({ content: createContentBody });

			this.revision = await this.apiClient.content.createRevision({
				id: this.content.id,
				properties: {
					extension,
				},
			});
			this.lastProgressPosition = this.uploadProgress;
			this.s3Uploader = new S3Uploader({
				file,
				key: this.revision.s3Key,
				signRequest: ({ file, key }) =>
					this.apiClient.s3Sign.sign({
						fileName: key,
						contentType: file.type,
						contentDisposition: 'auto',
					}),
				onProgress: progress => {
					this.uploadProgress = this.lastProgressPosition + (progress / (this.waitForProcessing ? 2 : 1) / totalFiles);
					this.onProgress(this.uploadProgress);
				},
			});

			await this.s3Uploader.upload();

			await this.apiClient.content.startWorkflow({
				id: this.content.id,
				revisionTag: this.revision.id,
			});

			if (this.waitForProcessing) {
				await this._monitorProgressAsync();
			} else {
				this.onSuccess(this.revision.d2lrn);
				this.s3Uploader = undefined;
			}
		} catch (error) {
			this.onError(resolveWorkerError(error, type));
		}
	}
}

decorate(Uploader, {
	uploadProgress: observable,
	uploadFile: action,
	reset: action,
});
