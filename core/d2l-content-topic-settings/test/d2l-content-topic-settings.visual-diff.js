import puppeteer from 'puppeteer';
import { VisualDiff } from '@brightspace-ui/visual-diff';

describe('d2l-content-topic-settings', () => {

	const visualDiff = new VisualDiff('content-topic-settings', import.meta.url);

	let browser, page;

	before(async() => {
		browser = await puppeteer.launch();
		page = await visualDiff.createPage(browser);
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
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
						}],
					})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/1') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
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
						}],
					})
				});
			} else {
				request.continue();
			}
		});
		await page.goto(
			`${visualDiff.getBaseUrl()}/core/d2l-content-topic-settings/test/d2l-content-topic-settings.visual-diff.html`,
			{ waitUntil: ['networkidle0', 'load'] }
		);
		await page.bringToFront();
	});

	beforeEach(async() => await visualDiff.resetFocus(page));

	after(async() => await browser.close());

	it('scorm', async function() {
		const rect = await visualDiff.getRect(page, '#topic-settings-scorm');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('audio', async function() {
		const rect = await visualDiff.getRect(page, '#topic-settings-audio');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

});
