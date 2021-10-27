import { action, decorate, flow, observable } from 'mobx';
import resolveWorkerError from '../util/resolve-worker-error';
import { S3Uploader } from '../util/s3-uploader';

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
	constructor({ apiClient, onSuccess, onError }) {
		this.apiClient = apiClient;
		this.onSuccess = onSuccess;
		this.onError = onError;

		this.uploadProgress = 0;

		this.uploadFile = flow((function * (file, title, captionLanguages) {
			/* eslint-disable no-invalid-this */
			yield this._uploadWorkflowAsync(file, title, captionLanguages);
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

	async _uploadWorkflowAsync(file, title, captionLanguages) {
		try {
			const sourceLanguage = captionLanguages?.length && captionLanguages[0];
			const extension = file.name.split('.').pop();
			this.content = await this.apiClient.createContent({
				title,
			});
			this.revision = await this.apiClient.createRevision(this.content.id, {
				extension,
				formats: ['hd', 'mp3'],
				...(sourceLanguage && { sourceLanguage })
			});

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
				captionLanguages,
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
