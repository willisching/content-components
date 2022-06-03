const contentServiceEndpointMap = {
	'/contentservice/api/97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7/content/0': {
		body: {
			id: 'ea5e117b-0686-485a-af6d-2518717c3deb',
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
			id: 'ea5e117b-0686-485a-af6d-2518717c3deb',
			title: 'Package title',
			description: 'Package description',
			sharedWith: ['ou:6606'],
			revisions: [{
				options: {
					playerShowNavBar: false,
					reviewRetake: true,
					recommendedPlayer: 1,
				},
				type: 'Audio'
			}]
		},
		status: 200
	},
	'/contentservice/api/97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7/topic': {
		body: {},
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
			} else if (ctx.url.startsWith('/d2l/lp/auth/xsrf-tokens')) {
				ctx.body = {};
				ctx.status = 200;
			}

			return next();
		},
	],
};
