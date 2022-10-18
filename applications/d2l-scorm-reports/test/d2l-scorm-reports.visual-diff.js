import puppeteer from 'puppeteer';
import { VisualDiff } from '@brightspace-ui/visual-diff';

describe('d2l-scorm-reports', () => {

	const visualDiff = new VisualDiff('d2l-scorm-reports', import.meta.url);

	let browser, page;

	before(async() => {
		browser = await puppeteer.launch({ headless: true });
		page = await visualDiff.createPage(browser);
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			const url = request.url();
			if (url.startsWith('http://localhost:8000/contentservice/api/fake-tenant-id/reports/topic/summary')) {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
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
					})
				});
			} else if (url.startsWith('http://localhost:8000/contentservice/api/fake-tenant-id/reports/topic/detail')) {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
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
					})
				});
			} else if (url.startsWith('http://localhost:8000/contentservice/api/fake-tenant-id/reports/activity')) {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
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
					})
				});
			} else if (url.startsWith('http://localhost:8000/contentservice/api/fake-tenant-id/reports/interactions')) {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
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
					})
				});
			} else if (url.startsWith('http://localhost:8000/contentservice/api/fake-tenant-id/reports/objectives')) {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						results: [
							{
								internalId: 12345,
								description: 'Description',
								score: 1,
								status: 'status',
								progress: 'complete',
							}
						]
					})
				});
			} else if (url.startsWith('http://localhost:8000/contentservice/api/fake-tenant-id/reports/users/summary')) {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						results: [
							{
								lmsUserId: '30220',
								firstName: 'First',
								lastName: 'Last',
								attempts: 2
							}
						]
					})
				});
			} else if (url.startsWith('http://localhost:8000/contentservice/api/fake-tenant-id/reports/users/detail')) {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
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
					})
				});
			} else {
				request.continue();
			}
		});

		await page.goto(
			`${visualDiff.getBaseUrl()}/applications/d2l-scorm-reports/test/d2l-scorm-reports.visual-diff.html`,
			{ waitUntil: ['networkidle0', 'load'] }
		);
		await page.bringToFront();
	});

	beforeEach(async() => await visualDiff.resetFocus(page));

	after(async() => await browser.close());

	it('topic-summary', async function() {
		const rect = await visualDiff.getRect(page, '#topic-summary-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('topic-detail', async function() {
		await page.evaluate(async() => {
			const waitElemRendered = async(root, query) => new Promise(resolve => {
				const waitTime = 200;
				const interval = setInterval(() => {
					const elem = root.shadowRoot.querySelector(query) ?? root.querySelector(query);
					if (elem !== null) {
						clearInterval(interval);
						resolve();
					}
				}, waitTime);
			});
			const scormReports = document.querySelector('#topic-detail');
			scormReports._goToTopicDetails({ detail: { topicId: 'topic-id', name: 'name' } });
			await scormReports.updateComplete;
			await waitElemRendered(scormReports, 'd2l-topic-detail');
		});

		const rect = await visualDiff.getRect(page, '#topic-detail-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('user-summary', async function() {
		await page.evaluate(async() => {
			const waitElemRendered = async(root, query) => new Promise(resolve => {
				const waitTime = 200;
				const interval = setInterval(() => {
					const elem = root.shadowRoot.querySelector(query) ?? root.querySelector(query);
					if (elem !== null) {
						clearInterval(interval);
						resolve();
					}
				}, waitTime);
			});
			const scormReports = document.querySelector('#user-summary');
			scormReports._goToUserSummary();
			await scormReports.updateComplete;
			await waitElemRendered(scormReports, 'd2l-user-summary');
		});

		const rect = await visualDiff.getRect(page, '#user-summary-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('user-detail', async function() {
		await page.evaluate(async() => {
			const waitElemRendered = async(root, query) => new Promise(resolve => {
				const waitTime = 200;
				const interval = setInterval(() => {
					const elem = root.shadowRoot.querySelector(query) ?? root.querySelector(query);
					if (elem !== null) {
						clearInterval(interval);
						resolve();
					}
				}, waitTime);
			});
			const scormReports = document.querySelector('#user-detail');
			scormReports._goToUserDetails({ detail: { userId: 'user-id', name: 'name' } });
			await scormReports.updateComplete;
			await waitElemRendered(scormReports, 'd2l-user-detail');
		});

		const rect = await visualDiff.getRect(page, '#user-detail-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('topic-activity', async function() {
		await page.evaluate(async() => {
			const waitElemRendered = async(root, query) => new Promise(resolve => {
				const waitTime = 200;
				const interval = setInterval(() => {
					const elem = root.shadowRoot.querySelector(query) ?? root.querySelector(query);
					if (elem !== null) {
						clearInterval(interval);
						resolve();
					}
				}, waitTime);
			});
			const scormReports = document.querySelector('#topic-activity');
			scormReports._goToTopicDetails({ detail: { topicId: 'topic-id', name: 'topic-name' } });
			await scormReports.updateComplete;

			scormReports._goToActivity({ detail: { topicId: 'topic-id', userId: 'user-id', name: 'name' } });
			await scormReports.updateComplete;

			await waitElemRendered(scormReports, 'd2l-activity');
			const activity = scormReports.shadowRoot.querySelector('d2l-activity');
			await waitElemRendered(activity, 'd2l-activity-summary');
		});

		const rect = await visualDiff.getRect(page, '#topic-activity-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('topic-interactions', async function() {
		await page.evaluate(async() => {
			const waitElemRendered = async(root, query) => new Promise(resolve => {
				const waitTime = 200;
				const interval = setInterval(() => {
					const elem = root.shadowRoot.querySelector(query) ?? root.querySelector(query);
					if (elem !== null) {
						clearInterval(interval);
						resolve();
					}
				}, waitTime);
			});
			const scormReports = document.querySelector('#topic-interactions');
			scormReports._goToTopicDetails({ detail: { topicId: 'topic-id', name: 'topic-name' } });
			await scormReports.updateComplete;

			scormReports._goToActivity({ detail: { topicId: 'topic-id', userId: 'user-id', name: 'name' } });
			await scormReports.updateComplete;

			await waitElemRendered(scormReports, 'd2l-activity');
			const activity = scormReports.shadowRoot.querySelector('d2l-activity');

			activity._goToInteractions();
			await activity.updateComplete;
			await waitElemRendered(activity, 'd2l-activity-interactions');
		});

		const rect = await visualDiff.getRect(page, '#topic-interactions-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('topic-objectives', async function() {
		await page.evaluate(async() => {
			const waitElemRendered = async(root, query) => new Promise(resolve => {
				const waitTime = 200;
				const interval = setInterval(() => {
					const elem = root.shadowRoot.querySelector(query) ?? root.querySelector(query);
					if (elem !== null) {
						clearInterval(interval);
						resolve();
					}
				}, waitTime);
			});
			const scormReports = document.querySelector('#topic-objectives');
			scormReports._goToTopicDetails({ detail: { topicId: 'topic-id', name: 'topic-name' } });
			await scormReports.updateComplete;

			scormReports._goToActivity({ detail: { topicId: 'topic-id', userId: 'user-id', name: 'name' } });
			await scormReports.updateComplete;

			await waitElemRendered(scormReports, 'd2l-activity');
			const activity = scormReports.shadowRoot.querySelector('d2l-activity');

			activity._goToObjectives();
			await activity.updateComplete;
			await waitElemRendered(activity, 'd2l-activity-objectives');
		});

		const rect = await visualDiff.getRect(page, '#topic-objectives-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});
});
