const contentServiceEndpointMap = {
	'/contentservice/api/97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7/content/0': {
		body: {
			title: 'Package title',
			description: 'Package description',
			sharedWith: ['ou:6606'],
			revisions: [{
				options: {
					playerShowNavBar: false,
					reviewRetake: true,
					recommendedPlayer: 1,
				},
				type: 'Scorm',
			}]
		},
		status: 200
	},
	'/contentservice/api/97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7/content/1': {
		body: {
			title: 'Package title',
			description: 'Package description',
			sharedWith: ['ou:6606'],
			revisions: [{
				options: {
					playerShowNavBar: false,
					reviewRetake: true,
					recommendedPlayer: 1,
				},
				type: 'Audio',
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
