const numItems = 105;

function generateHits(id) {
	return {
		'_source': {
			'createdAt': '2022-05-03T21:55:24.308Z',
			'processingStatus': 'ready',
			'lastRevType': 'Scorm',
			'lastRevTitle': `quicktest${id}`,
			'lastRevStorageVersion': 2,
			'tenantId': '97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7',
			'lastRevId': `${id}`,
			'id': `${id}`,
			'ownerId': '169',
			'sharedWith': ['ou:6606'],
			'storageId': `${id}`,
			'updatedAt': '2022-05-03T21:58:01.203Z'
		},
	};
}

const mockedRoutes = {
	'/contentservice/api/97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7/search/': ctx => {
		const urlParams = new URLSearchParams(ctx.url);
		const start = Number(urlParams.get('start'));
		const hits = [];
		for (let i = 0; i < 10 && i + start < numItems; i++) {
			hits.push(generateHits(i + start));
		}

		const numHits = hits.length;

		ctx.body = {
			'took': 5,
			'timed_out': false,
			'_shards': {'total': numHits, 'successful': numHits, 'skipped': 0, 'failed': 0},
			'hits': {
				'total': numHits,
				'max_score': null,
				'hits': hits,
			}
		};

		ctx.status = 200;
	},
	'/contentservice/api/97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7/content': ctx => {
		ctx.body = {
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
		};
		ctx.status = 200;
	},
	'/contentservice/api/97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7/topic': ctx => {
		ctx.body = {};
		ctx.status = 200;
	},
	'/contentservice/region': ctx => {
		ctx.body = { region: 'us-east-1' };
		ctx.status = 200;
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
