const contentServiceEndpointMap = {
	'/contentservice/api/97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7/content/a0605fa8-a348-4361-83b0-925fc57e761e?': {
		body: {
			sharedWith: ['ou:6606'],
			revisions: [{
				options: {
					playerShowNavBar: false,
					reviewRetake: true,
					recommendedPlayer: 1,
				}
			}]
		},
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