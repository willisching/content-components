import { action, decorate, flow, observable } from 'mobx';
import resolveWorkerError from '../util/resolve-worker-error.js';
import { S3Uploader } from '../util/s3-uploader.js';
import { randomizeDelay, sleep } from '../util/delay.js';
import { getExtension } from '../util/media-type-util.js';

const UPLOAD_FAILED_ERROR = 'workerErrorUploadFailed';

export class Uploader {
	constructor({ apiClient, onSuccess, onError, waitForProcessing }) {
		this.apiClient = apiClient;
		this.onSuccess = onSuccess;
		this.onError = onError;
		this.waitForProcessing = waitForProcessing;

		this.uploadProgress = 0;

		/* eslint-disable no-invalid-this */
		this.uploadFile = flow((function * (file, title) {
			yield this._ulpoadWorkflowAsync(file, title);
		/* eslint-enable no-invalid-this */
		}));

		// allow a way to set special progress handlers such as for smart-curriculum
		this.progressHandler = function() {};
	}

	async cancelUpload() {
		if (this.content && this.s3Uploader) {
			this.s3Uploader.abort();
			await this.apiClient.deleteContent(this.content.id);
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
			const progress = await this.apiClient.getWorkflowProgress({
				contentId: this.content.id,
				revisionId: this.revision.id,
			});
			this.uploadProgress = 50 + ((progress.percentComplete || 0) / 2);
			this.progressHandler();
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

	async _uploadWorkflowAsync(file, title) {
		try {
			const extension = getExtension(file.name);
			this.content = await this.apiClient.createContent({
				title,
			});
			this.revision = await this.apiClient.createRevision(
				this.content.id,
				{
					extension,
				},
			);
			this.s3Uploader = new S3Uploader({
				file,
				key: this.revision.s3Key,
				signRequest: ({ file, key }) =>
					this.apiClient.signUploadRequest({
						fileName: key,
						contentType: file.type,
						contentDisposition: 'auto',
					}),
				onProgress: progress => {
					this.uploadProgress = progress / (this.waitForProcessing ? 2 : 1);
					this.progressHandler();
				},
			});

			await this.s3Uploader.upload();

			await this.apiClient.processRevision({
				contentId: this.content.id,
				revisionId: this.revision.id,
			});

			if (this.waitForProcessing) {
				await this._monitorProgressAsync();
			} else {
				this.onSuccess(this.revision.d2lrn);
				this.s3Uploader = undefined;
			}
		} catch (error) {
			this.onError(resolveWorkerError(error));
		}
	}
}

decorate(Uploader, {
	uploadProgress: observable,
	uploadFile: action,
	reset: action,
});
