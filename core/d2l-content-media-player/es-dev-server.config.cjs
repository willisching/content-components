const contentServiceEndpointMap = {
	'/contentservice/api/0/content/0/revisions/latest?contextType=topic&contextId=12345': {
		body: {
			title: 'Title',
			description: 'Description',
			formats: ['hd', 'sd'],
			type: 'Video',
			ready: true,
		},
		status: 200
	},
	'/contentservice/api/0/content/0/revisions/latest/resources/transcodes/signed-url?disposition=attachment&format=hd&contextType=topic&contextId=12345': {
		body: {
			value: 'https://d2l-content-test-files.s3.amazonaws.com/sample.webm'
		},
		status: 200
	},
	'/contentservice/api/0/content/0/revisions/latest/resources/transcodes/signed-url?disposition=attachment&contextType=topic&contextId=12345': {
		body: {
			value: 'https://d2l-content-test-files.s3.amazonaws.com/sample.webm'
		},
		status: 200
	},
	'/contentservice/api/0/content/0/revisions/latest/resources/transcodes/signed-url?disposition=attachment&format=sd&contextType=topic&contextId=12345': {
		body: {
			value: 'https://d2l-content-test-files.s3.amazonaws.com/sample.webm'
		},
		status: 200
	},
	'/contentservice/api/0/content/0/revisions/latest/resources/captions/signed-urls?contextType=topic&contextId=12345': {
		body: [],
		status: 200
	},
	'/contentservice/api/0/content/0/revisions/latest/resources/poster/signed-url?contextType=topic&contextId=12345': {
		body: {
		},
		status: 200
	},
	'/contentservice/api/0/content/0/revisions/latest/resources/metadata/file-content?contextType=topic&contextId=12345': {
		body: {
		},
		status: 200
	},
	'/contentservice/api/0/content/0/revisions/latest/resources/thumbnails/signed-url?contextType=topic&contextId=12345': {
		body: {
		},
		status: 200
	},
	'/contentservice/api/0/content/1/revisions/latest?contextType=topic&contextId=12345': {
		body: {
			title: 'Title',
			description: 'Description',
			type: 'Audio',
			ready: true,
		},
		status: 200
	},
	'/contentservice/api/0/content/1/revisions/latest/resources/transcodes/signed-url?disposition=attachment&contextType=topic&contextId=12345': {
		body: {
			value: 'https://d2l-content-test-files.s3.amazonaws.com/sample-audio.mp3'
		},
		status: 200
	},
	'/contentservice/api/0/content/1/revisions/latest/resources/captions/signed-urls?contextType=topic&contextId=12345': {
		body: [],
		status: 200
	}
};

module.exports = {
	middlewares: [
		function mockContentServiceApis(ctx, next) {
			if (ctx.url.startsWith('/contentservice')) {
				const endpointMatch = contentServiceEndpointMap[ctx.url];
				if (endpointMatch) {
					ctx.body = endpointMatch.body;
					ctx.status = endpointMatch.status;
				}
			}

			return next();
		},
	],
};
