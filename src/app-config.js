const properties = {
	apiEndpoint: { type: String, attribute: 'api-endpoint' },
	authToken: { type: String, attribute: 'auth-token' }
};

export default {
	properties,

	fromObject: obj => {
		const config = {};
		for (const key of Object.keys(properties)) {
			config[key] = obj[key];
		}

		return config;
	}
};
