const mockRequestMap = {
	'/contentservice/api/0/content': {
		body: { id: 0 },
		status: 200
	},
	'/contentservice/api/0/content/0/revisions': {
		body: { id: 0, s3Key: 'test' },
		status: 200
	},
	'/contentservice/api/s3/sign?contentType=Video&fileName=test&contentDisposition=auto': {
		body: { signedUrl: 'test-signed-url' },
		status: 200
	},
	'/contentservice/api/s3/sign?contentType=Audio&fileName=test&contentDisposition=auto': {
		body: { signedUrl: 'test-signed-url' },
		status: 200
	},
	'/contentservice/api/0/content/0': {
		body: {},
		status: 200
	},
	'/contentservice/api/0/content/0/revisions/0/process': {
		body: {},
		status: 200
	},
	'/core/d2l-media-capture/demo/test-signed-url': {
		body: {},
		status: 200
	},
	'/d2l/api/le/1.58/wcs/captionsLocales': {
		body: [
			{
				CultureCode: 'en-US',
				IsDefault: true,
				LocaleName: 'English (United States)',
				AutoCaptions: true
			},
			{
				CultureCode: 'fr-CA',
				IsDefault: false,
				LocaleName: 'Français (Canada)',
				AutoCaptions: true
			},
			{
				CultureCode: 'fr-ON',
				IsDefault: false,
				LocaleName: 'Français (Ontario)',
				AutoCaptions: false
			}
		],
		status: 200
	}
};

module.exports = {
	middlewares: [
		function mock(ctx, next) {
			const requestMatch = mockRequestMap[ctx.url];
			if (requestMatch) {
				ctx.body = requestMatch.body;
				ctx.status = requestMatch.status;
			}
			return next();
		}
	]
};
