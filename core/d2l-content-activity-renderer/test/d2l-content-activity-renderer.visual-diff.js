import puppeteer from 'puppeteer';
import { VisualDiff } from '@brightspace-ui/visual-diff';

const VIDEO_SOURCE = 'https://d2l-content-test-files.s3.amazonaws.com/sample.webm';
const AUDIO_SOURCE = 'https://d2l-content-test-files.s3.amazonaws.com/sample-audio.mp3';

describe('d2l-content-activity-renderer', () => {

	const visualDiff = new VisualDiff('content-activity-renderer', import.meta.url);

	let browser, page;

	before(async() => {
		browser = await puppeteer.launch({ headless: true });
		page = await visualDiff.createPage(browser);
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest?contextType=topic&contextId=0') {
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
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest/resources/transcodes/signed-url?disposition=attachment&contextType=topic&contextId=0') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						value: VIDEO_SOURCE
					})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest/resources/captions/signed-urls?contextType=topic&contextId=0') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify([])
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest/resources/poster/signed-url?contextType=topic&contextId=0') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest/resources/metadata/file-content?contextType=topic&contextId=0') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/0/revisions/latest/resources/thumbnails/signed-url?contextType=topic&contextId=0') {
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
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/1/revisions/latest?contextType=topic&contextId=1') {
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
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/1/revisions/latest/resources/transcodes/signed-url?disposition=attachment&contextType=topic&contextId=1') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						value: AUDIO_SOURCE
					})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/1/revisions/latest/resources/captions/signed-urls?contextType=topic&contextId=1') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify([])
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/2/revisions/latest?contextType=topic&contextId=2') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						title: 'Title',
						description: 'Description',
						type: 'Scorm',
						ready: true,
					})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/content/2/revisions/latest/preview-url') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						previewUrl: 'mocked-scorm.html'
					})
				});
			} else if (request.url() === 'http://localhost:8000/topics/0/0') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						properties: {
							d2lrn: 'd2l:brightspace:content:region:0:video:0',
							contentServiceEndpoint: 'http://localhost:8000/contentservice',
							topicId: '0'
						}
					})
				});
			} else if (request.url() === 'http://localhost:8000/topics/0/1') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						properties: {
							d2lrn: 'd2l:brightspace:content:region:0:audio:1',
							contentServiceEndpoint: 'http://localhost:8000/contentservice',
							topicId: '1'
						}
					})
				});
			} else if (request.url() === 'http://localhost:8000/topics/0/2') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({
						properties: {
							d2lrn: 'd2l:brightspace:content:region:0:scorm:2',
							contentServiceEndpoint: 'http://localhost:8000/contentservice',
							topicId: '2'
						}
					})
				});
			} else if (request.url() === 'http://localhost:8000/contentservice/api/0/topic/1002/launch') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({ url: 'mocked-scorm.html' })
				});
			} else if (request.url() === 'http://localhost:8000/d2l/lp/auth/xsrf-tokens') {
				request.respond({
					status: 200,
					content: 'application/json',
					body: JSON.stringify({})
				});
			} else if (request.url() === 'http://localhost:8000/d2l/lp/auth/oauth2/token') {
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
			`${visualDiff.getBaseUrl()}/core/d2l-content-activity-renderer/test/d2l-content-activity-renderer.visual-diff.html`,
			{ waitUntil: ['networkidle0', 'load'] }
		);
		await page.bringToFront();
	});

	beforeEach(async() => await visualDiff.resetFocus(page));

	after(async() => await browser.close());

	it('renderer-video', async function() {
		const rect = await visualDiff.getRect(page, '#content-activity-renderer-video');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('renderer-audio', async function() {
		const rect = await visualDiff.getRect(page, '#content-activity-renderer-audio');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('renderer-scorm', async function() {
		const rect = await visualDiff.getRect(page, '#content-activity-renderer-scorm');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

});
