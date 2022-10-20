import puppeteer from 'puppeteer';
import { VisualDiff } from '@brightspace-ui/visual-diff';

describe('d2l-recycling-bin', () => {

	const visualDiff = new VisualDiff('d2l-recycling-bin', import.meta.url);

	let browser, page;

	const today = new Date();
	const twoDaysAgo = new Date(today);
	twoDaysAgo.setDate(today.getDate() - 2);

	before(async() => {
		browser = await puppeteer.launch({ headless: true });
		page = await visualDiff.createPage(browser);
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			const url = request.url();
			if (url.startsWith('http://localhost:8000/contentservice/api/fake-tenant-id/search/content')) {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						'hits': {
							'total': 3,
							'hits': [{
								'_source': {
									'ownerId': '169',
									'deletedByUserId': '169',
									'deletedAt': twoDaysAgo,
									'lastRevTitle': 'quicktest',
								},
							}, {
								'_source': {
									'ownerId': '169',
									'deletedByUserId': '169',
									'deletedAt': twoDaysAgo,
									'lastRevTitle': "Oh, It's a baseball",
								},
							}, {
								'_source': {
									'ownerId': '169',
									'deletedByUserId': '169',
									'deletedAt': twoDaysAgo,
									'lastRevTitle': 'Golf',
								},
							}
							]
						}
					})
				});
			} else if (url.startsWith('http://localhost:8000/d2l/api/lp/1.22/users/169')) {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						'FirstName': 'D2L',
						'LastName': 'Support',
					})
				});
			} else if (url.startsWith('http://localhost:8000/d2l/lp/auth/xsrf-tokens')) {
				request.respond({});
			} else {
				request.continue();
			}
		});

		await page.goto(
			`${visualDiff.getBaseUrl()}/applications/d2l-recycling-bin/test/d2l-recycling-bin.visual-diff.html`,
			{ waitUntil: ['networkidle0', 'load'] }
		);
		await page.bringToFront();
	});

	beforeEach(async() => await visualDiff.resetFocus(page));

	after(async() => await browser.close());

	it('recycling-bin', async function() {
		const rect = await visualDiff.getRect(page, '#recycling-bin-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});
});
