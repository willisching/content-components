const mockedRoutes = {
	'/contentservice/api/fake-tenant-id/search/content': ctx => {
		ctx.body = {
			'hits': {
				'total': 2,
				'hits': [
					{
						'_source': {
							'lastRevType': 'Scorm',
							'lastRevTitle': 'quicktest12',
							'id': 'fake-id-1',
							'ownerId': '169',
						}
					},
					{
						'_source': {
							'lastRevType': 'Mp4',
							'lastRevTitle': 'sample-mixed-video.mp4',
							'id': 'fake-id-2',
							'ownerId': '169',
						}
					}
				]
			}
		};
	},
	'/contentservice/api/fake-tenant-id/content/fake-id-1/revisions/latest/topics': ctx => {
		ctx.body = [
			{
				'contextId': '6606',
				'contexts': {
					'6606': {
						'resourceLinkTitle': 'quicktest12'
					}
				},
				'id': '10097701',
				'revisionTag': 'latest',
			}
		];
	},
	'/contentservice/api/fake-tenant-id/content/fake-id-2/revisions/latest/topics': ctx => {
		ctx.body = [
			{
				'contextId': '6606',
				'contexts': {
					'6606': {
						'resourceLinkTitle': 'video'
					}
				},
				'id': '10097701',
			}
		];
	},
	'/contentservice/api/fake-tenant-id/content/fake-id-1': ctx => {
		ctx.body = {
			'revisions': [
				{
					'id': 'fake-revision-id-1',
					'type': 'Scorm',
				}
			],
		};
	},
	'/contentservice/api/fake-tenant-id/content/fake-id-2': ctx => {
		ctx.body = {
			'revisions': [
				{
					'id': 'fake-revision-id-2',
					'type': 'Mp4',
				}
			],
		};
	},
};

module.exports = {
	middlewares: [
		function mockContentServiceApis(ctx, next) {
			const path = Object.keys(mockedRoutes).find(path => ctx.url.startsWith(path));
			mockedRoutes[path] && mockedRoutes[path](ctx);

			return next();
		}
	],
};
