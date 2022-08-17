import { randomizeDelay, sleep } from './delay';

const RETRIES = 5;
const MB = 1024 * 1024;

export class S3Uploader {
	constructor({
		file,
		key,
		isMultipart = false,
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
		this.chunks = this.getChunks();
		this.lastProgress = null;
		this.totalProgress = 0;
		this.httprequests = [];
		this.uploadId = null;
	}

	abort() {
		console.log('abort');
		if (this.isMultipart && this.uploadId) {
			console.log('multipart abort');
			this.abortMultipartUpload({key: this.key, uploadId: this.uploadId});
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

	getChunks() {
		if (this.file.size === 0 || !this.isMultipart) {
			return [this.file];
		}
		const chunkSize = Math.max(5 * MB, Math.ceil(this.file.size / 10000));

		const chunks = [];
		for (let start = 0; start < this.file.size; start += chunkSize) {
			const end = Math.min(start + chunkSize, this.file.size);
			chunks.push(this.file.slice(start, end));
		}
		return chunks;
	}

	resetProgress(index) {
		const lastProgress = this.lastProgress[index];
		this.totalProgress -= lastProgress;
		this.lastProgress[index] = 0;
	}

	updateProgress(value, index) {
		const progressDiff = value - this.lastProgress[index];
		this.lastProgress[index] = value;
		this.totalProgress += progressDiff;
	}

	async upload() {
		this.totalProgress = 0;
		this.lastProgress = new Array(this.chunks.length).fill(0);
		this.httprequests = new Array(this.chunks.length).fill(null);
		if (this.isMultipart) {
			return await this.uploadMultipart();
		}
		const { file, key } = this;
		const signResult = await this.signRequest({ file, key });
		return this._uploadWithRetries(file, signResult);
	}

	async uploadMultipart() {
		const { UploadId } = await this.createMultipartUpload({key: this.key});
		this.uploadId = UploadId;
		const signedUrls = await this.batchSign({key: this.key, uploadId: UploadId, numParts: this.chunks.length});
		const uploadPromises = [];
		for (let i = 0; i < signedUrls.length; i++) {
			const url = signedUrls[i];
			uploadPromises.push(this._uploadWithRetries(this.chunks[i], {signedUrl: url}, RETRIES, i).then((response) => {
				const etag = response.getResponseHeader('ETag');
				return {
					ETag: etag,
					PartNumber: i + 1
				};
			}).catch(err => {
				console.log(err);
			}));
		}
		const uploadResponses = await Promise.all(uploadPromises);

		await this.completeMultipartUpload({key: this.key, uploadId: UploadId, parts: { Parts: uploadResponses }});
	}

	_getErrorRequestContext(xhr) {
		return {
			response: xhr.responseText,
			status: xhr.status,
			statusText: xhr.statusText,
			readyState: xhr.readyState
		};
	}

	async _startUpload(file, signResult, progressIndex) {
		return new Promise((resolve, reject) => {
			const xhr = this.createRequest('PUT', signResult.signedUrl);
			xhr.addEventListener('load', (ev) => {
				if (xhr.status >= 200 && xhr.status <= 299) {
					this.updateProgress(this.chunks[progressIndex].size, progressIndex);
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
					this.updateProgress(event.loaded, progressIndex);
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

	async _uploadWithRetries(file, signResult, retries = RETRIES, progressIndex = 0) {
		try {
			return await this._startUpload(file, signResult, progressIndex);
		} catch (error) {
			if (error.name !== 'XHRError' || retries <= 0) {
				throw error;
			}
			await sleep(randomizeDelay(5000, 1000));
			this.resetProgress(progressIndex);
			return this._uploadWithRetries(file, signResult, --retries, progressIndex);
		}
	}

}
