import { sleep } from './delay';
import pLimit from 'p-limit';

const MAX_RETRIES = 5;
const MB = 1024 * 1024;

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

	abort() {
		if (this.isMultipart && this.uploadId) {
			this.abortMultipartUpload({uploadId: this.uploadId});
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
		return this._uploadWithRetries(file, signResult);
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

	async _uploadMultipart() {
		const { uploadId } = await this.createMultipartUpload();
		this.uploadId = uploadId;
		const signedUrls = await this.batchSign({uploadId, numParts: this.chunks.length});
		const uploadPromises = [];
		for (let i = 0; i < signedUrls.length; i++) {
			const url = signedUrls[i].value;
			uploadPromises.push(this.concurrentUploadLimit(() =>
				this._uploadWithRetries(this.chunks[i], {signedUrl: url}, 0, i)
					.then((response) => {
						const etag = response.getResponseHeader('ETag');
						return {
							ETag: etag,
							PartNumber: i + 1
						};
					}).catch(err => {
						this.abort();
						throw err;
					})));
		}

		const uploadResponses = await Promise.all(uploadPromises);

		for (let retries = 0; retries < MAX_RETRIES; retries++) {
			try {
				await this.completeMultipartUpload({ uploadId, parts: { parts: uploadResponses }});
				break;
			} catch (err) {
				if (retries === MAX_RETRIES - 1) {
					this.abort();
					break;
				}
				await sleep(2 ** (retries + 1) * 1000);
			}
		}
	}

	async _uploadWithRetries(file, signResult, retries = 0, progressIndex = 0) {
		try {
			return await this._startUpload(file, signResult, progressIndex);
		} catch (error) {
			if (error.name !== 'XHRError' || retries >= MAX_RETRIES) {
				throw error;
			}
			await sleep(2 ** (retries + 1) * 1000);
			this._resetProgress(progressIndex);
			return this._uploadWithRetries(file, signResult, retries + 1, progressIndex);
		}
	}

}
