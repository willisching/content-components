export class S3Uploader {
	constructor({
		file,
		key,
		signRequest = () => {},
		onProgress = () => {},
		onError = () => {},
	} = {}) {
		this.file = file,
		this.key = key,
		this.signRequest = signRequest;
		this.onProgress = onProgress;
		this.onError = onError;
	}

	createRequest(method, url, opts) {
		var opts = opts || {};
		var xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		if (opts.withCredentials != null) {
			xhr.withCredentials = opts.withCredentials;
		}
		return xhr;
	};

	_getErrorRequestContext(xhr) {
		return {
			response: xhr.responseText,
			status: xhr.status,
			statusText: xhr.statusText,
			readyState: xhr.readyState
		};
	}

	async upload() {
		const file = this.file;
		const key = this.key;
		const signResult = await this.signRequest({ file, key });
		const xhr = this.createRequest('PUT', signResult.signedUrl);

		return new Promise((resolve, reject) => {
			xhr.onload = function() {
				if (xhr.status >= 200 && xhr.status <= 299) {
					this.onProgress(100);
					resolve();
				} else {
					reject(new Error(`Filed to upload file ${file.name}: ${xhr.status} ${xhr.statusText}`));
				}
			}.bind(this);
			xhr.onerror = function() {
				reject(new Error(`XHR error for ${file.name}: ${xhr.status} ${xhr.statusText}`));
			}.bind(this);
			xhr.upload.onprogress = function(e) {
				if (e.lengthComputable) {
					const percentLoaded = Math.round((e.loaded / e.total) * 100);
					return this.onProgress(percentLoaded);
				}
			}.bind(this);
			xhr.setRequestHeader('Content-Type', file.type);
			var headers = signResult.headers
			if (headers) {
				Object.keys(headers).forEach(function(key) {
					var val = headers[key];
					xhr.setRequestHeader(key, val);
				})
			}
			xhr.setRequestHeader('x-amz-acl', 'private');
			this.httprequest = xhr;
			xhr.send(file);
		});
	}

	abort() {
		this.httprequest && this.httprequest.abort();
	}
}
