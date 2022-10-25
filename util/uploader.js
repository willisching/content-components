import { action, decorate, flow, observable, toJS } from 'mobx';

import resolveWorkerError from './resolve-worker-error.js';
import { S3Uploader } from './s3-uploader.js';
import { isAudioType, isVideoType, getType } from './media-type-util.js';
import { randomizeDelay, sleep } from './delay';
import { retry } from './retry.js';
import ContentType from './content-type.js';
import playerOption from './player-option.js';
const MAX_ATTEMPTS = 10;

export class Uploader {
	constructor({
		apiClient,
		onSuccess = () => {},
		onError = () => {},
		onProgress = () => {},
		onUploadFinish,
		postupload = () => {},
		preupload = () => {},
		clientApp,
		waitForProcessing,
		existingContentId,
		shareUploadsWith,
		isMultipart
	}) {
		this.nextUploadId = 0;
		this.uploads = [];
		this.apiClient = apiClient;
		this.clientApp = clientApp;
		this.waitForProcessing = waitForProcessing;
		this.existingContentId = existingContentId;
		this.shareUploadsWith = shareUploadsWith;
		this.isMultipart = isMultipart;
		this.uploadsInProgress = 0;
		this.uploadConcurrency = 5;
		this.statusWindowVisible = false;
		this.queuedUploads = [];
		this.runningJobs = 0;
		this._batch = 0;
		this.successfulUpload = {};
		this.totalProgress = 0;
		this.onProcessingFinish = onSuccess;
		this.onProgress = onProgress;
		this.onError = onError;
		this.onUploadFinish = onUploadFinish ? onUploadFinish : onSuccess;
		this.postupload = postupload;
		this.preupload = preupload;

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
				err: loadError ? loadError : null,
				batch: this._batch
			};
			this.nextUploadId += 1;
			this.uploads.unshift(uploadInfo);

			if (!loadError) {
				yield this._monitorProgressAsync(uploadInfo.id, content, revision, uploadInfo.title, this._monitorProgressCallback);
			}
			/* eslint-enable no-invalid-this */
		});
	}

	async cancelUpload() {
		for (let i = 0; i < this.uploads.length; i++) {
			const upload = this.uploads[i];
			if (upload.uploader) {
				await upload.uploader.abort();
				await this._deleteContentOrRevision(upload.contentId, upload.revisionId);
			}
		}
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

	reset() {
		this.nextUploadId = 0;
		this.uploads = [];
		this.uploadsInProgress = 0;
		this.statusWindowVisible = false;
		this.queuedUploads = [];
		this.runningJobs = 0;
		this._batch = 0;
		this.successfulUpload = {};
		this.totalProgress = 0;
		this.onProgress(0);
	}

	showStatusWindow(show) {
		this.statusWindowVisible = show;
	}

	async uploadFiles(files) {
		this.preupload({files});
		this._batch += 1;
		for (const file of files) {
			this.uploadFile(file, this._batch).then(this.postupload);
		}

		if (files.length > 0) {
			this.statusWindowVisible = true;
		}
	}

	async _deleteContentOrRevision(contentId, revisionId) {
		if (this.existingContentId) {
			await this.apiClient.content.deleteRevision({ id: contentId, revisionTag: revisionId });
		} else {
			await this.apiClient.content.deleteItem({ id: contentId });
		}
	}

	_handleError(upload, ...err) {
		this._updateProgress(upload, 0);
		this.onError(...err);
	}

	async _monitorProgressAsync(
		uploadId,
		content,
		revision,
		title,
		progressCallback,
		attempts = 0
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

				const upload = this.uploads.find(
					upload => upload.id === uploadId
				);
				this._handleError(upload, err, upload.title);

				progressCallback({
					uploadId,
					content,
					revision,
					error: err
				});
				try {
					await this._deleteContentOrRevision(content.id, revision.id);
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
				if (this.existingContentId) {
					await this.apiClient.content.updateItem({ content: { id: this.existingContentId, title } });
				}
				this.onProcessingFinish(revision.d2lrn);
				return;
			}
		} catch (error) {
			if (error.status && error.status === 404) {
				err = resolveWorkerError(error);
				const upload = this.uploads.find(
					upload => upload.id === uploadId
				);
				this._handleError(upload, err, upload.title);
				progressCallback({
					uploadId,
					contentId: content.id,
					revisionId: revision.id,
					error: err
				});
				return;
			}
			if (attempts > MAX_ATTEMPTS) {
				await this._deleteContentOrRevision(content.id, revision.id);
				const upload = this.uploads.find(
					upload => upload.id === uploadId
				);
				this._handleError(upload, error, upload.title);
				return;
			}
		}

		await sleep(randomizeDelay(5000, 1000));
		await this._monitorProgressAsync(uploadId, content, revision, title, progressCallback, attempts);
	}

	async _monitorProgressCallback({ uploadId, content, revision, percentComplete = 0, ready, error }) {
		const upload = this.uploads.find(
			upload => upload.id === uploadId
		);
		if (upload) {
			this._updateProgress(upload, 50 + (percentComplete / 2));
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

	_updateProgress(upload, value) {
		const lastProgress = upload.progress;
		upload.progress = value;
		const diff = value - lastProgress;
		this.totalProgress += diff;
		this.onProgress(this.totalProgress / this.uploads.length);
	}

	async _uploadWorkflowAsync({ id: uploadId, file, extension }) {
		const type = getType(file.name);
		try {
			this.runningJobs += 1;
			const createContentBody = {
				title: file.name,
				type,
				...this.shareUploadsWith
					&& this.shareUploadsWith.length > 0
					&& { sharedWith: this.shareUploadsWith },
			};

			if (isAudioType(file.name) || isVideoType(file.name)) {
				createContentBody.clientApp = this.clientApp;
			}

			let content;
			let revision;

			await retry(async() => {
				content = this.existingContentId ?
					await this.apiClient.content.getItem({ id: this.existingContentId }) :
					await this.apiClient.content.postItem({ content: createContentBody });
				const revisionContent = {
					id: content.id,
					properties: {
						extension,
					}
				};
				const defaultOptions = {
					playerShowNavBar: false,
					reviewRetake: false,
					recommendedPlayer: playerOption.EMBEDDED
				};
				if (type === ContentType.SCORM) {
					revisionContent.properties.options = defaultOptions;
				}
				revision = await this.apiClient.content.createRevision(revisionContent);

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
							this._updateProgress(upload, progress / (this.waitForProcessing ? 2 : 1));
						}
					},
					abortMultipartUpload: async({uploadId}) => this.apiClient.content.abortMultipartUpload({uploadId, contentId, revisionId}),
					batchSign: async({uploadId, numParts}) => this.apiClient.content.batchSign({uploadId, numParts, contentId, revisionId}),
					completeMultipartUpload: async({uploadId, parts}) => this.apiClient.content.completeMultipartUpload({uploadId, parts, contentId, revisionId}),
					createMultipartUpload: async() => this.apiClient.content.initializeMultipartUpload({contentId, revisionId})
				});
				const upload = this.uploads.find(
					upload => upload.id === uploadId
				);
				upload.contentId = contentId;
				upload.revisionId = revisionId;
				upload.uploader = uploader;
				await uploader.upload();
				await this.apiClient.content.startWorkflow({
					id: content.id,
					revisionTag: revision.id
				});
				if (this.waitForProcessing) {
					await this._monitorProgressAsync(uploadId, content, revision, file.name, this._monitorProgressCallback);}
				this.onUploadFinish(revision.d2lrn);
			}, {
				tries: MAX_ATTEMPTS,
				delay: () => randomizeDelay(5000, 1000),
				onFailedRetry: async() => {
					if (revision) {
						await this.apiClient.content.deleteRevision({ id: content.id, revisionTag: revision.id });
					}
					if (!this.existingContentId) {
						await this.apiClient.content.deleteItem({ id: content.id });
					}
				}
			});
		} catch (error) {
			const upload = this.uploads.find(
				upload => upload.id === uploadId
			);
			upload.error = resolveWorkerError(error, type);
			this._handleError(upload, upload.error, upload.title);
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
