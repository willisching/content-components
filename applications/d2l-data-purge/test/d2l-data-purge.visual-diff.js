import puppeteer from 'puppeteer';
import { VisualDiff } from '@brightspace-ui/visual-diff';

describe('d2l-data-purge', () => {

	const visualDiff = new VisualDiff('d2l-data-purge', import.meta.url);

	let browser, page;

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
					})
				});
			} else if (url.startsWith('http://localhost:8000/contentservice/api/fake-tenant-id/content/fake-id-1/revisions/latest/topics')) {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify([
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
					])
				});
			} else if (url.startsWith('http://localhost:8000/contentservice/api/fake-tenant-id/content/fake-id-1')) {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						'revisions': [
							{
								'id': 'fake-revision-id-1',
								'type': 'Scorm',
							}
						], })
				});
			} else if (url === 'http://localhost:8000/favicon.ico') {
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
			`${visualDiff.getBaseUrl()}/applications/d2l-data-purge/test/d2l-data-purge.visual-diff.html`,
			{ waitUntil: ['networkidle0', 'load'] }
		);
		await page.bringToFront();
	});

	beforeEach(async() => await visualDiff.resetFocus(page));
	afterEach(async() => await page.reload());

	after(async() => await browser.close());

	it('data-purge-search', async function() {
		const rect = await visualDiff.getRect(page, '#data-purge-search-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});
	it('data-purge-search-results', async function() {
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
			const dataPurge = document.querySelector('#data-purge-search-result');
			await waitFinishLoading(dataPurge);
			const input = dataPurge.shadowRoot.querySelector('#input-search');
			input.value = '169';
			const filterButton = dataPurge.shadowRoot.querySelector('#filter-button');
			filterButton.click();
			await waitFinishLoading(dataPurge);
		});
		const rect = await visualDiff.getRect(page, '#data-purge-search-result-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});
	it('data-purge-options', async function() {
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
			const dataPurge = document.querySelector('#data-purge-options');
			await waitFinishLoading(dataPurge);
			const input = dataPurge.shadowRoot.querySelector('#input-search');
			input.value = '169';
			const filterButton = dataPurge.shadowRoot.querySelector('#filter-button');
			filterButton.click();
			await waitFinishLoading(dataPurge);
			const link = dataPurge.shadowRoot.querySelector('#link-0').shadowRoot.querySelector('.d2l-link');
			link.click();
			await waitFinishLoading(dataPurge);
		});
		const rect = await visualDiff.getRect(page, '#data-purge-options-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});
	it('data-purge-options-result', async function() {
		await page.evaluate(async() => {
			const waitFinishLoading = async(elem) => new Promise(resolve => {
				const waitTime = 200;
				const interval = setInterval(() => {
					if (!elem._isLoading && !elem._isLoadingOptions) {
						clearInterval(interval);
						resolve();
					}
				}, waitTime);
			});
			const dataPurge = document.querySelector('#data-purge-options-result');
			await waitFinishLoading(dataPurge);
			const input = dataPurge.shadowRoot.querySelector('#input-search');
			input.value = '169';
			const filterButton = dataPurge.shadowRoot.querySelector('#filter-button');
			filterButton.click();
			await waitFinishLoading(dataPurge);
			dataPurge.shadowRoot.querySelector('d2l-link').click();
			await waitFinishLoading(dataPurge);
			dataPurge.shadowRoot.querySelector('d2l-menu-item').click();
			await waitFinishLoading(dataPurge);
		});
		const rect = await visualDiff.getRect(page, '#data-purge-options-result-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});
});
