import { action, decorate, flow, observable } from 'mobx';
import resolveWorkerError from './resolve-worker-error.js';
import { S3Uploader } from './s3-uploader.js';
import { randomizeDelay, sleep } from './delay.js';
import { getExtension, isAudioType, isVideoType, getType } from './media-type-util.js';

/* eslint-disable no-unused-vars */
export class Uploader {
	constructor({ apiClient, onSuccess, onError, waitForProcessing, existingContentId, shareUploadsWith = [], onProgress = progress => {}, onUploadFinish }) {
		/* eslint-enable no-unused-vars */
		this.apiClient = apiClient;
		this.onProcessingFinish = onSuccess;
		this.onError = onError;
		this.waitForProcessing = waitForProcessing;
		this.existingContentId = existingContentId;
		this.shareUploadsWith = shareUploadsWith;
		this.onProgress = onProgress;
		this.uploadProgress = 0;
		this.totalFiles = 1;
		this.onUploadFinish = onUploadFinish ? onUploadFinish : onSuccess;

		this.uploadFile = flow((function * (file, title, fileType, totalFiles = 1) {
			/* eslint-disable no-invalid-this */
			this.totalFiles = totalFiles;
			yield this._uploadWorkflowAsync(file, title);
			/* eslint-enable no-invalid-this */
		}));
	}

	async cancelUpload(content, s3Uploader) {
		s3Uploader.abort();
		await this.apiClient.content.deleteItem({ id: content.id });
	}

	reset() {
		this.uploadProgress = 0;
	}

	_handleError(lastProgressPosition, ...error) {
		// if error, treat file progress as completely uploaded
		this.uploadProgress += ((100 - lastProgressPosition) / (this.waitForProcessing ? 2 : 1) / this.totalFiles);
		this.onError(...error);
	}

	async _monitorProgressAsync(content, revision, lastProgressPosition, title) {
		// Stop monitoring if the upload was cancelled.
		if (!content || !revision) {
			return;
		}

		try {
			const progress = await this.apiClient.content.getWorkflowProgress({
				id: content.id,
				revisionTag: revision.id,
			});
			// occasionally progress.percentComplete comes back as NaN (particularly during bulk upload), so treat as 0 when that happens
			// with broken files, progress.percentComplete may revert back to 0 upon failure leading to adding negative progress, so treat as 0 when that happens
			this.uploadProgress += (((Math.max(progress.percentComplete - lastProgressPosition, 0) || 0) / 2) / this.totalFiles);
			lastProgressPosition = progress.percentComplete || lastProgressPosition;
			this.onProgress(this.uploadProgress, content.id);
			if (progress.ready) {
				// only update title of revision after it successfully processes
				if (this.existingContentId) {
					await this.apiClient.content.updateItem({ content: { id: this.existingContentId, title } });
				}
				this.onProcessingFinish(revision.d2lrn);
				return;
			}

			if (progress.didFail) {
				// undo changes to properties by deleting revision
				await this.apiClient.content.deleteRevision({ id: content.id, revisionTag: revision.id });
				const workerErrorType = resolveWorkerError(JSON.parse(progress.details), content.type);
				this._handleError(lastProgressPosition, workerErrorType, title);
				return;
			}
		} catch (error) {
			if (error.cause > 399 && error.cause < 500) {
				// unsure if should delete revision here as well
				this._handleError(lastProgressPosition, resolveWorkerError(error, content.type));
				return;
			}
		}

		await sleep(randomizeDelay(5000, 1000));
		await this._monitorProgressAsync(content, revision, lastProgressPosition, title);
	}

	async _uploadWorkflowAsync(file, title) {
		const type = getType(file.name);
		let lastProgressPosition = 0;
		try {
			const extension = getExtension(file.name);
			const createContentBody = {
				title,
				type,
				...this.shareUploadsWith
					&& this.shareUploadsWith.length > 0
					&& { sharedWith: this.shareUploadsWith },
			};

			if (isAudioType(file.name) || isVideoType(file.name)) {
				createContentBody.clientApp = 'LmsContent';
			}

			const content = this.existingContentId ?
				await this.apiClient.content.getItem({ id: this.existingContentId }) :
				await this.apiClient.content.postItem({ content: createContentBody });

			const revision = await this.apiClient.content.createRevision({
				id: content.id,
				properties: {
					extension,
				},
			});
			const s3Uploader = new S3Uploader({
				file,
				key: revision.s3Key,
				isMultipart: true,
				signRequest: ({ file, key }) =>
					this.apiClient.s3Sign.sign({
						fileName: key,
						contentType: file.type,
						contentDisposition: 'auto',
					}),
				onProgress: progress => {
					this.uploadProgress += ((progress - lastProgressPosition) / (this.waitForProcessing ? 2 : 1) / this.totalFiles);
					lastProgressPosition = progress;
					this.onProgress(this.uploadProgress);
				},
				abortMultipartUpload: async({key, uploadId}) => this.apiClient.s3.abortMultipartUpload({key, uploadId}),
				batchSign: async({key, uploadId, numParts}) => this.apiClient.s3.batchSign({key, uploadId, numParts}),
				completeMultipartUpload: async({key, uploadId, parts}) => this.apiClient.s3.completeMultipartUpload({key, uploadId, parts}),
				createMultipartUpload: async({key}) => this.apiClient.s3.initializeMultipartUpload({key})
			});

			await s3Uploader.upload();

			await this.apiClient.content.startWorkflow({
				id: content.id,
				revisionTag: revision.id,
			});

			this.onUploadFinish(revision.d2lrn);
			if (this.waitForProcessing) {
				await this._monitorProgressAsync(content, revision, 0, title);
			}
		} catch (error) {
			this._handleError(lastProgressPosition, resolveWorkerError(error, type));
		}
	}
}

decorate(Uploader, {
	uploadProgress: observable,
	uploadFile: action,
	reset: action,
});
