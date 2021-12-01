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
		let resolve, reject;
		const promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});
		const run = async() => {
			const xhr = this.createRequest('PUT', signResult.signedUrl);
			xhr.addEventListener('load', () => {
				if (xhr.status >= 200 && xhr.status <= 299) {
					this.onProgress(100);
				} else {
					reject(new Error(`Failed to upload file ${file.name}: ${xhr.status} ${xhr.statusText}`));
				}
			});
			xhr.addEventListener('error', () => {
				setTimeout(() => {
					run();
				}, 5000);
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
		};

		run();
		return promise;
	}

	_getErrorRequestContext(xhr) {
		return {
			response: xhr.responseText,
			status: xhr.status,
			statusText: xhr.statusText,
			readyState: xhr.readyState
		};
	}

}
