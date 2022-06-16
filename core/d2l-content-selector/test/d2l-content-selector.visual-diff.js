import puppeteer from 'puppeteer';
import { VisualDiff } from '@brightspace-ui/visual-diff';

const numItems = 105;
function generateHits(id) {
	return {
		'_source':{
			'createdAt':'2022-05-03T21:55:24.308Z',
			'processingStatus':'ready',
			'lastRevType':'Scorm',
			'lastRevTitle':`quicktest${id}`,
			'lastRevStorageVersion':2,
			'tenantId':'97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7',
			'lastRevId':`${id}`,
			'id':`${id}`,
			'ownerId':'169',
			'sharedWith':['ou:6606'],
			'storageId':`${id}`,
			'updatedAt':'2022-05-03T21:58:01.203Z'
		},
	};
}

describe('d2l-content-selector', () => {

	const visualDiff = new VisualDiff('content-selector', import.meta.url);

	let browser, page;

	before(async() => {
		browser = await puppeteer.launch({ headless: true });
		page = await visualDiff.createPage(browser);
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			const url = request.url();
			if (url.startsWith('http://localhost:8000/api/search/content')) {
				const urlParams = new URLSearchParams(url);
				const start = Number(urlParams.get('start'));
				const hits = [];
				for (let i = 0; i < 10 && i + start < numItems; i++) {
					hits.push(generateHits(i + start));
				}

				const numHits = hits.length;

				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						'took': 5,
						'timed_out':false,
						'_shards':{ 'total': numHits, 'successful': numHits, 'skipped': 0, 'failed': 0 },
						'hits':{
							'total':numHits,
							'max_score':null,
							'hits': hits,
						}
					})
				});
			} else if (url === 'http://localhost:8000/favicon.ico') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({})
				});
			} else if (url === 'http://localhost:8000/d2l/lp/auth/xsrf-tokens') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({})
				});
			} else if (url === 'http://localhost:8000/api/content/0') {
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
			} else if (url === 'http://localhost:8000/api/content/1') {
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
			} else if (url === 'http://localhost:8000/region') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						region: 'us-east-1'
					})
				});
			} else {
				request.continue();
			}
		});
		await page.goto(
			`${visualDiff.getBaseUrl()}/core/d2l-content-selector/test/d2l-content-selector.visual-diff.html`,
			{ waitUntil: ['networkidle0', 'load'] }
		);
		await page.bringToFront();
	});

	beforeEach(async() => await visualDiff.resetFocus(page));

	after(async() => await browser.close());

	it('list', async function() {
		const rect = await visualDiff.getRect(page, '#list-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('upload', async function() {
		await page.evaluate(async() => {
			const contentSelector = document.querySelector('#upload-view');
			const contentSelectorList = contentSelector.shadowRoot.querySelector('d2l-content-selector-list');
			const uploadButton = contentSelectorList.shadowRoot.querySelector('#upload-button');

			uploadButton.click();
			await contentSelector.updateComplete;

			const uploader = contentSelector.shadowRoot.querySelector('d2l-content-uploader');
			await uploader.updateComplete;
			await contentSelector.updateComplete;
		});

		const rect = await visualDiff.getRect(page, '#upload-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('topic-settings', async function() {
		await page.evaluate(async() => {
			const contentSelector = document.querySelector('#topic-settings-view');
			const contentSelectorList = contentSelector.shadowRoot.querySelector('d2l-content-selector-list');
			const radioButton = contentSelectorList.shadowRoot.querySelector('.d2l-input-radio');
			radioButton.click();
			await contentSelector.updateComplete;
			contentSelector.shadowRoot.querySelector('#selector-list-next').click();

			await contentSelector.updateComplete;
			const settings = contentSelector.shadowRoot.querySelector('d2l-content-topic-settings');
			await settings.updateComplete;
		});

		const rect = await visualDiff.getRect(page, '#topic-settings-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('properties', async function() {
		await page.evaluate(async() => {
			const contentSelector = document.querySelector('#properties-view');
			const contentSelectorList = contentSelector.shadowRoot.querySelector('d2l-content-selector-list');
			const editProperties = contentSelectorList.shadowRoot.querySelector('.edit-properties');
			editProperties.click();
			await contentSelector.updateComplete;

			const properties = contentSelector.shadowRoot.querySelector('d2l-content-properties');
			await properties.updateComplete;
		});

		const rect = await visualDiff.getRect(page, '#properties-container');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});
});
