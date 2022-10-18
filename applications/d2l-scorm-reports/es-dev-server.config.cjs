const mockedRoutes = {
	'/contentservice/api/fake-tenant-id/reports/topic/summary': ctx => {
		ctx.body = {
			results: [
				{
					attempts: 1,
					averageScore: 0,
					averageTimeSpent: 35,
					completed: 0,
					passed: 0,
					title: 'Title',
					topicId: '10097706',
					type: 'Scorm',
				}
			]
		};
	},
	'/contentservice/api/fake-tenant-id/reports/topic/detail': ctx => {
		ctx.body = {
			results: [
				{
					attempts: 1,
					completion: 'completed',
					firstName: 'First',
					lastAccessed: '2022-10-06T17:44:46.000Z',
					lastName: 'Last',
					lmsUserId: '30220',
					progress: null,
					score: 98,
					status: 'unknown',
					timeSpent: 9
				}
			]
		};
	},
	'/contentservice/api/fake-tenant-id/reports/users/summary': ctx => {
		ctx.body = {
			results: [
				{
					lmsUserId: '30220',
					firstName: 'First',
					lastName: 'Last',
					attempts: 2
				}
			]
		};
	},
	'/contentservice/api/fake-tenant-id/reports/users/detail': ctx => {
		ctx.body = {
			results: [
				{
					attempts: 1,
					completion: 'completed',
					lastAccessed: '2022-10-06T17:44:46.000Z',
					progress: null,
					score: 98,
					status: 'unknown',
					timeSpent: 9,
					title: 'quicktest12.zip',
					topicId: '10097707',
					type: 'Scorm'
				}
			]
		};
	},
	'/contentservice/api/fake-tenant-id/reports/activity': ctx => {
		ctx.body = {
			results: [
				{
					completion: 'completed',
					id: '10097707-30220-43906b1f-0340-4eb3-8943-a0b69677deb1-1',
					lmsUserId: '30220',
					score: 98,
					status: 'unknown',
					timestamp: '2022-10-06T17:44:46.000Z',
					topicId: '10097707',
				}
			]
		};
	},
	'/contentservice/api/fake-tenant-id/reports/interactions': ctx => {
		ctx.body = {
			results: [
				{
					internalId: 12345,
					interactionType: 'Interaction Type',
					description: 'Description',
					correctResponses: 10,
					learnerResponse: 'Learner Response',
					attempt: 1,
					result: 'Result',
					weighting: 1,
					latency: '000:00:00',
				}
			]
		};
	},
	'/contentservice/api/fake-tenant-id/reports/objectives': ctx => {
		ctx.body = {
			results: [
				{
					internalId: 12345,
					description: 'Description',
					score: 1,
					status: 'status',
					progress: 'complete',
				}
			]
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
