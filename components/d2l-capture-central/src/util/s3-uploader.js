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

	createRequest(method, url, opts = {}) {
		const xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		if (opts.withCredentials !== null) {
			xhr.withCredentials = opts.withCredentials;
		}

		return xhr;
	}

	_getErrorRequestContext(xhr) {
		return {
			response: xhr.responseText,
			status: xhr.status,
			statusText: xhr.statusText,
			readyState: xhr.readyState
		};
	}

	async upload() {
		const { file, key } = this;
		const signResult = await this.signRequest({ file, key });
		return new Promise((resolve, reject) => {
			const xhr = this.createRequest('PUT', signResult.signedUrl);
			xhr.addEventListener('load', () => {
				if (xhr.status >= 200 && xhr.status <= 299) {
					this.onProgress(100);
					resolve();
				} else {
					reject(new Error(`Failed to upload file ${file.name}: ${xhr.status} ${xhr.statusText}`));
				}
			});
			xhr.addEventListener('error', () => {
				reject(new Error(`XHR error for ${file.name}: ${xhr.status} ${xhr.statusText}`));
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
			xhr.send(file);
		});
	}

	abort() {
		if (this.httprequest) {
			this.httprequest.abort();
		}
	}
}
