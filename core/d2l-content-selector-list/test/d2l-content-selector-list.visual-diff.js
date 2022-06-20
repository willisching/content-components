import puppeteer from 'puppeteer';
import { VisualDiff } from '@brightspace-ui/visual-diff';

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

describe('d2l-content-selector-list', () => {

	const visualDiff = new VisualDiff('content-selector-list', import.meta.url);

	let browser, page;

	before(async() => {
		browser = await puppeteer.launch({ headless: true });
		page = await visualDiff.createPage(browser);
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			const url = request.url();
			if (url.startsWith('http://localhost:8000/contentservice/api/0/search/')) {
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
						'timed_out': false,
						'_shards': { 'total': numHits, 'successful': numHits, 'skipped': 0, 'failed': 0 },
						'hits': {
							'total': numHits,
							'max_score': null,
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
			} else {
				request.continue();
			}
		});
		await page.goto(
			`${visualDiff.getBaseUrl()}/core/d2l-content-selector-list/test/d2l-content-selector-list.visual-diff.html`,
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
			const elems = Array.from(document.querySelectorAll('d2l-content-selector-list'));

			await Promise.all(elems.map((elem) => waitFinishLoading(elem)));
		});
	});

	beforeEach(async() => await visualDiff.resetFocus(page));

	after(async() => await browser.close());

	it('content-selector-list', async function() {
		const rect = await visualDiff.getRect(page, '#content-selector-list');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});
});
