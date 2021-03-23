import * as Auth from 'superagent-d2l-session-auth';
import * as Request from 'superagent';

export default class UserBrightspaceClient {
	constructor(endpoint) {
		this.endpoint = endpoint;
	}

	async deleteCaptions(orgUnitId, topicId, language) {
		const url = `${this.endpoint}/d2l/api/le/1.51/${orgUnitId}/content/topics/${topicId}/captions/${language}`;
		const response = await Request
			.del(url)
			.use(Auth({ trustedHost: this._getHost(this.endpoint) }));
		return response;
	}

	async getCaptions(orgUnitId, topicId, pageSize) {
		const url = `${this.endpoint}/d2l/api/le/1.51/${orgUnitId}/content/topics/${topicId}/captions`;
		const query = { pageSize };
		const response = await Request
			.get(url)
			.use(Auth({ trustedHost: this._getHost(this.endpoint) }))
			.query(query);
		return response;
	}

	async uploadCaptionsFile(orgUnitId, topicId, language, fileData) {
		const url = `${this.endpoint}/d2l/api/le/1.51/${orgUnitId}/content/topics/${topicId}/captions/${language}`;
		const response = await Request
			.put(url)
			.use(Auth({ trustedHost: this._getHost(this.endpoint) }))
			.attach('file', fileData);
		return response;
	}

	_getHost(baseUrl) {
		return /https?:\/\/([^/]+).*/.exec(baseUrl)[1];
	}
}
