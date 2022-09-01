import { retry } from './retry';
import pLimit from 'p-limit';

const MAX_RETRIES = 5;
const MB = 1024 * 1024;
const retryOptions = {
	retries: MAX_RETRIES,
	delay: (tries) => exponentialBackoff(tries, 2)
};

function exponentialBackoff(tries, base) {
	return base ** (tries + 1) * 1000;
}

export class S3Uploader {
	constructor({
		file,
		key,
		minChunkSize = 10 * MB,
		isMultipart = false,
		concurrency = 5,
		abortMultipartUpload = async() => {},
		batchSign = async() => {},
		completeMultipartUpload = async() => {},
		createMultipartUpload = async() => {},
		signRequest = () => {},
		onProgress = () => {}
	} = {}) {
		this.file = file;
		this.key = key;
		this.signRequest = signRequest;
		this.abortMultipartUpload = abortMultipartUpload;
		this.batchSign = batchSign;
		this.completeMultipartUpload = completeMultipartUpload;
		this.createMultipartUpload = createMultipartUpload;
		this.isMultipart = isMultipart;
		this.onProgress = onProgress;
		this.minChunkSize = minChunkSize;
		this.lastProgress = null;
		this.totalProgress = 0;
		this.httprequests = [];
		this.uploadId = null;
		this.concurrentUploadLimit = pLimit(concurrency);
	}

	async abort() {
		if (this.isMultipart && this.uploadId) {
			await retry(() => this.abortMultipartUpload({uploadId: this.uploadId}), retryOptions);
		}
		for (let i = 0; i < this.httprequests.length; i++) {
			if (this.httprequests[i]) {
				this.httprequests[i].abort();
			}
		}
	}

	createRequest(method, url, opts = {}) {
		const xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		if (opts.withCredentials !== null) {
			xhr.withCredentials = opts.withCredentials;
		}

		return xhr;
	}

	async upload() {
		this.totalProgress = 0;
		this.chunks = this._getChunks();
		this.lastProgress = new Array(this.chunks.length).fill(0);
		this.httprequests = new Array(this.chunks.length).fill(null);
		if (this.isMultipart) {
			return await this._uploadMultipart();
		}
		const { file, key } = this;
		const signResult = await this.signRequest({ file, key });
		return this._uploadChunk({chunk: file, signResult});
	}

	_getChunks() {
		if (this.file.size === 0 || !this.isMultipart) {
			return [this.file];
		}
		const chunkSize = Math.max(this.minChunkSize, Math.ceil(this.file.size / 10000));

		const chunks = [];
		for (let start = 0; start < this.file.size; start += chunkSize) {
			const end = Math.min(start + chunkSize, this.file.size);
			chunks.push(this.file.slice(start, end));
		}
		return chunks;
	}

	_getErrorRequestContext(xhr) {
		return {
			response: xhr.responseText,
			status: xhr.status,
			statusText: xhr.statusText,
			readyState: xhr.readyState
		};
	}

	_resetProgress(index) {
		const lastProgress = this.lastProgress[index];
		this.totalProgress -= lastProgress;
		this.lastProgress[index] = 0;
	}

	async _startUpload(file, signResult, progressIndex) {
		return new Promise((resolve, reject) => {
			const xhr = this.createRequest('PUT', signResult.signedUrl);
			xhr.addEventListener('load', (ev) => {
				if (xhr.status >= 200 && xhr.status <= 299) {
					this._updateProgress(this.chunks[progressIndex].size, progressIndex);
					this.onProgress(this.totalProgress / this.file.size * 100);
					resolve(ev.target);
				} else {
					reject(new Error(`Failed to upload file ${file.name}: ${xhr.status} ${xhr.statusText}`));
				}
			});
			xhr.addEventListener('error', () => {
				const error = new Error(`XHR error for ${file.name}: ${xhr.status} ${xhr.statusText}`);
				error.name = 'XHRError';
				reject(error);
			});
			xhr.upload.addEventListener('progress', event => {
				if (event.lengthComputable) {
					this._updateProgress(event.loaded, progressIndex);
					return this.onProgress(this.totalProgress / this.file.size * 100);
				}
			});
			xhr.setRequestHeader('Content-Type', file.type);
			const { headers } = signResult;
			if (headers) {
				Object.keys(headers).forEach(key => {
					const val = headers[key];
					xhr.setRequestHeader(key, val);
				});
			}

			if (!this.isMultipart) xhr.setRequestHeader('x-amz-acl', 'private');

			this.httprequests[progressIndex] = xhr;
			xhr.send(file);
		});
	}

	_updateProgress(value, index) {
		const progressDiff = value - this.lastProgress[index];
		this.lastProgress[index] = value;
		this.totalProgress += progressDiff;
	}

	async _uploadChunk({chunk, signResult, retries = MAX_RETRIES, progressIndex = 0}) {
		return retry(async() => await this._startUpload(chunk, signResult, progressIndex), {
			...retryOptions,
			retries
		});
	}

	async _uploadMultipart() {
		const { uploadId } = await retry(() => this.createMultipartUpload(), retryOptions);
		this.uploadId = uploadId;
		const signedUrls = await retry(() => this.batchSign({uploadId, numParts: this.chunks.length}), retryOptions);
		const uploadPromises = [];
		for (let i = 0; i < signedUrls.length; i++) {
			const url = signedUrls[i].value;
			uploadPromises.push(this.concurrentUploadLimit(() =>
				this._uploadChunk({ chunk: this.chunks[i], signResult: {signedUrl: url}, progressIndex: i})
					.then((response) => {
						const etag = response.getResponseHeader('ETag');
						return {
							ETag: etag,
							PartNumber: i + 1
						};
					}).catch(async err => {
						await this.abort();
						throw err;
					})));
		}

		const uploadResponses = await Promise.all(uploadPromises);

		await retry(async() => await this.completeMultipartUpload({ uploadId, parts: { parts: uploadResponses }}), retryOptions);
	}

}
