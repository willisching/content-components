import { action, decorate, flow, observable } from 'mobx';
import resolveWorkerError from '../util/resolve-worker-error';
import { S3Uploader } from '../util/s3-uploader';
import { randomizeDelay, sleep } from '../util/delay';

export class Uploader {
	constructor({ apiClient, onSuccess, onError }) {
		this.apiClient = apiClient;
		this.onSuccess = onSuccess;
		this.onError = onError;

		this.uploadProgress = 0;

		this.uploadFile = flow((function * (file, title, fileType) {
			/* eslint-disable no-invalid-this */
			yield this._uploadWorkflowAsync(file, title, fileType);
			/* eslint-enable no-invalid-this */
		}));
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
				revisionId: this.revision.id
			});

			this.uploadProgress = 50 + ((progress.percentComplete || 0) / 2);

			if (progress.ready) {
				this.onSuccess(this.revision.d2lrn);
				this.s3Uploader = undefined;
				return;
			}
		} catch (error) {
			this.onError(resolveWorkerError(error));
			this.s3Uploader = undefined;
			return;
		}

		await sleep(randomizeDelay(5000, 1000));
		await this._monitorProgressAsync(this.content, this.revision);
	}

	async _uploadWorkflowAsync(file, title, fileType) {
		try {
			const extension = file.name.split('.').pop();
			const isAudio = fileType.startsWith('audio');
			this.content = await this.apiClient.createContent({
				title,
			});
			this.revision = await this.apiClient.createRevision(
				this.content.id,
				{
					extension,
					formats: isAudio ? ['mp3'] : ['hd', 'sd'],
				}
			);

			this.s3Uploader = new S3Uploader({
				file,
				key: this.revision.s3Key,
				signRequest: ({ file, key }) =>
					this.apiClient.signUploadRequest({
						fileName: key,
						contentType: file.type,
						contentDisposition: 'auto'
					}),
				onProgress: progress => {
					this.uploadProgress = progress / 2;
				}
			});

			await this.s3Uploader.upload();

			await this.apiClient.processRevision({
				contentId: this.content.id,
				revisionId: this.revision.id,
			});

			await this._monitorProgressAsync();
		} catch (error) {
			this.onError(resolveWorkerError(error));
		}
	}
}

decorate(Uploader, {
	uploadProgress: observable,
	uploadFile: action,
	reset: action
});
