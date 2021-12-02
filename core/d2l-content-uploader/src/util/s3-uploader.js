import { randomizeDelay, sleep } from './delay';

const RETRIES = 5;

export class S3Uploader {
	constructor({
		file,
		key,
		signRequest = () => {},
		onProgress = () => {}
	} = {}) {
		this.file = file;
		this.key = key;
		this.signRequest = signRequest;
		this.onProgress = onProgress;
	}

	abort() {
		if (this.httprequest) {
			this.httprequest.abort();
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
		const { file, key } = this;
		const signResult = await this.signRequest({ file, key });
		return this._uploadWithRetries(file, signResult);
	}

	_getErrorRequestContext(xhr) {
		return {
			response: xhr.responseText,
			status: xhr.status,
			statusText: xhr.statusText,
			readyState: xhr.readyState
		};
	}

	async _startUpload(file, signResult) {
		return new Promise((resolve, reject) => {
			const xhr = this.createRequest('PUT', signResult.signedUrl);
			xhr.addEventListener('load', () => {
				if (xhr.status >= 200 && xhr.status <= 299) {
					this.onProgress(100);
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
					const percentLoaded = Math.round((event.loaded / event.total) * 100);
					return this.onProgress(percentLoaded);
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

			xhr.setRequestHeader('x-amz-acl', 'private');
			this.httprequest = xhr;
			xhr.onload = () => resolve(xhr.response);
			xhr.send(file);
		});
	}

	async _uploadWithRetries(file, signResult, retries = RETRIES) {
		try {
			return await this._startUpload(file, signResult);
		} catch (error) {
			if (error.name !== 'XHRError' || retries <= 0) {
				throw error;
			}
			await sleep(randomizeDelay(5000, 1000));
			return this._uploadWithRetries(file, signResult, --retries);
		}
	}

}
