import puppeteer from 'puppeteer';
import { VisualDiff } from '@brightspace-ui/visual-diff';
describe('d2l-content-media-player', () => {

	const visualDiff = new VisualDiff('content-media-player', import.meta.url);

	let browser, page;

	before(async() => {
		browser = await puppeteer.launch();
		page = await visualDiff.createPage(browser);
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest?contextType=topic&contextId=12345') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						title: 'Title',
						description: 'Description',
						format: 'mp4',
						type: 'Video',
						ready: true,
					})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest/resources/transcodes/signed-url?disposition=attachment&contextType=topic&contextId=12345') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						value: 'sample.webm'
					})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest/resources/captions/signed-urls?contextType=topic&contextId=12345') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify([])
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest/resources/poster/signed-url?contextType=topic&contextId=12345') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest/resources/metadata/file-content?contextType=topic&contextId=12345') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest/resources/thumbnails/signed-url?contextType=topic&contextId=12345') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({})
				});
			} else if (request.url() === 'http://localhost:8000/favicon.ico') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/1/revisions/latest?contextType=topic&contextId=12345') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						title: 'Title',
						description: 'Description',
						type: 'Audio',
						ready: true,
					})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/1/revisions/latest/resources/transcodes/signed-url?disposition=attachment&contextType=topic&contextId=12345') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						value: 'sample-audio.mp3'
					})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/1/revisions/latest/resources/captions/signed-urls?contextType=topic&contextId=12345') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify([])
				});
			} else {
				request.continue();
			}
		});
		await page.goto(
			`${visualDiff.getBaseUrl()}/core/d2l-content-media-player/test/d2l-content-media-player.visual-diff.html`,
			{ waitUntil: ['networkidle0', 'load'] }
		);
		await page.bringToFront();
	});

	beforeEach(async() => await visualDiff.resetFocus(page));

	after(async() => await browser.close());

	it('media-player-video', async function() {
		const rect = await visualDiff.getRect(page, '#media-player-video');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('media-player-audio', async function() {
		const rect = await visualDiff.getRect(page, '#media-player-audio');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

});
