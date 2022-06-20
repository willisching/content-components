import puppeteer from 'puppeteer';
import { VisualDiff } from '@brightspace-ui/visual-diff';

describe('d2l-content-properties', () => {

	const visualDiff = new VisualDiff('content-properties', import.meta.url);

	let browser, page;

	before(async() => {
		browser = await puppeteer.launch();
		page = await visualDiff.createPage(browser);
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			if (request.url() === 'http://localhost:8000/contentservice/api/97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7/content/0') {
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
			} else if (request.url() === 'http://localhost:8000/contentservice/api/97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7/content/1') {
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
			`${visualDiff.getBaseUrl()}/core/d2l-content-properties/test/d2l-content-properties.visual-diff.html`,
			{ waitUntil: ['networkidle0', 'load'] }
		);
		await page.bringToFront();
		await page.evaluate(async() => {
			const waitFinishLoading = async(elem) => new Promise(resolve => {
				const waitTime = 200;
				const interval = setInterval(() => {
					if (!elem._isLoading) {
						clearInterval(interval);
						resolve();
					}
				}, waitTime);
			});
			const elems = Array.from(document.querySelectorAll('d2l-content-properties'));

			await Promise.all(elems.map((elem) => waitFinishLoading(elem)));
		});
	});

	beforeEach(async() => await visualDiff.resetFocus(page));

	after(async() => await browser.close());

	it('scorm', async function() {
		const rect = await visualDiff.getRect(page, '#content-properties-scorm');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('audio', async function() {
		const rect = await visualDiff.getRect(page, '#content-properties-audio');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

});
