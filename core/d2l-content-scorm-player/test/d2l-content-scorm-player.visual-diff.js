import puppeteer from 'puppeteer';
import { VisualDiff } from '@brightspace-ui/visual-diff';
describe('d2l-content-scorm-player', () => {

	const visualDiff = new VisualDiff('content-scorm-player', import.meta.url);

	let browser, page;

	before(async() => {
		browser = await puppeteer.launch();
		page = await visualDiff.createPage(browser);
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			if (request.url() === 'http://localhost:8000/contentservice/api/0/content/2/revisions/latest/preview-url') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						previewUrl: 'mocked-scorm.html'
					})
				});
			} else if (request.url() === 'http://localhost:8000/favicon.ico') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({})
				});
			} else {
				request.continue();
			}
		});
		await page.goto(
			`${visualDiff.getBaseUrl()}/core/d2l-content-scorm-player/test/d2l-content-scorm-player.visual-diff.html`,
			{ waitUntil: ['networkidle0', 'load'] }
		);
		await page.bringToFront();
	});

	beforeEach(async() => await visualDiff.resetFocus(page));

	after(async() => await browser.close());

	it('scorm-player', async function() {
		await page.evaluate(async() => {
			const scormPlayer = document.querySelector('#scorm-player');
			const iframe = scormPlayer.shadowRoot.querySelector('iframe');
			let isLoaded = false;
			const handleLoad = () => {
				isLoaded = true;
			};
			iframe.addEventListener('load', handleLoad.bind(this));
			const waitLoad = () => {
				return new Promise(resolve => {
					if (isLoaded) return resolve();

					setTimeout(waitLoad, 100);
				});
			};
			await waitLoad;
		});

		const rect = await visualDiff.getRect(page, '#scorm-player');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

});
