const mockedRoutes = {
	'/contentservice/api/fake-tenant-id/search/content': ctx => {
		ctx.body = {
			'hits': {
				'total': 3,
				'hits': [{
					'_source': {
						'ownerId': '169',
						'deletedByUserId': '169',
						'deletedAt': '2022-10-17T14:22:59.526Z',
						'lastRevTitle': 'quicktest',
					},
				}, {
					'_source': {
						'ownerId': '169',
						'deletedByUserId': '169',
						'deletedAt': '2022-10-17T14:22:37.913Z',
						'lastRevTitle': "Oh, It's a baseball",
					},
				}, {
					'_source': {
						'ownerId': '169',
						'deletedByUserId': '169',
						'deletedAt': '2022-10-17T14:22:28.142Z',
						'lastRevTitle': 'Golf',
					},
				}
				]}
		};
	},
	'/d2l/api/lp/1.22/users/169': ctx => {
		ctx.body = {
			'FirstName': 'D2L',
			'LastName': 'Support',
		};
	},
	'/d2l/lp/auth/xsrf-tokens': ctx => {
		ctx.body = {};
	},
	'/contentservice/api/fake-tenant-id/content': ctx => {
		ctx.status = 204;
	}
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
