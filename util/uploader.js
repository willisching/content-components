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
		this.totalFiles = 1;

		this.uploadFile = flow((function * (file, title, fileType, totalFiles = 1) {
			/* eslint-disable-next-line no-invalid-this */
			yield this._uploadWorkflowAsync(file, title, totalFiles);
		}));
	}

	async cancelUpload(content, s3Uploader) {
		s3Uploader.abort();
		await this.apiClient.content.deleteItem({ id: content.id });
	}

	reset() {
		this.uploadProgress = 0;
	}

	async _monitorProgressAsync(content, revision, lastProgressPosition) {
		// Stop monitoring if the upload was cancelled.
		if (!content || !revision) {
			return;
		}

		try {
			const progress = await this.apiClient.content.getWorkflowProgress({
				id: content.id,
				revisionTag: revision.id,
			});
			this.uploadProgress += (((progress.percentComplete - lastProgressPosition || 0) / 2) / this.totalFiles);
			lastProgressPosition = progress.percentComplete;
			this.onProgress(this.uploadProgress, content.id);
			if (progress.ready) {
				this.onSuccess(revision.d2lrn);
				return;
			}

			if (progress.didFail) {
				this.onError(UPLOAD_FAILED_ERROR, content.title);
				return;
			}
		} catch (error) {
			if (error.cause > 399 && error.cause < 500) {
				this.onError(resolveWorkerError(error, content.type));
				return;
			}
		}

		await sleep(randomizeDelay(5000, 1000));
		await this._monitorProgressAsync(content, revision, lastProgressPosition);
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

			const content = this.existingContentId ?
				await this.apiClient.content.updateItem({ content: { id: this.existingContentId, title } }) :
				await this.apiClient.content.postItem({ content: createContentBody });

			const revision = await this.apiClient.content.createRevision({
				id: content.id,
				properties: {
					extension,
				},
			});
			let lastProgressPosition = 0;
			const s3Uploader = new S3Uploader({
				file,
				key: revision.s3Key,
				signRequest: ({ file, key }) =>
					this.apiClient.s3Sign.sign({
						fileName: key,
						contentType: file.type,
						contentDisposition: 'auto',
					}),
				onProgress: progress => {
					this.uploadProgress += ((progress - lastProgressPosition) / (this.waitForProcessing ? 2 : 1) / totalFiles);
					lastProgressPosition = progress;
					this.onProgress(this.uploadProgress);
				},
			});

			await s3Uploader.upload();

			await this.apiClient.content.startWorkflow({
				id: content.id,
				revisionTag: revision.id,
			});

			if (this.waitForProcessing) {
				await this._monitorProgressAsync(content, revision, 0);
			} else {
				this.onSuccess(revision.d2lrn);
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
