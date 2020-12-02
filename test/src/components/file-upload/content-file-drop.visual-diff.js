const puppeteer = require('puppeteer');
const VisualDiff = require('@brightspace-ui/visual-diff');

describe('content-file-drop', () => {

	const visualDiff = new VisualDiff('content-file-drop', __dirname);

	let browser, page;

	before(async() => {
		browser = await puppeteer.launch();
		page = await visualDiff.createPage(browser);
		await page.setViewport({ width: 800, height: 1500, deviceScaleFactor: 2 });
		await page.goto(`${visualDiff.getBaseUrl()}/test/src/components/file-upload/content-file-drop.visual-diff.html`, { waitUntil: ['networkidle0', 'load'] });
		await page.bringToFront();
	});

	beforeEach(async() => {
		await visualDiff.resetFocus(page);
	});

	after(async() => await browser.close());

	it('displays file drop without error message', async function() {
		const rect = await visualDiff.getRect(page, '#file-drop-enabled-no-error');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('displays file drop with error message', async function() {
		const rect = await visualDiff.getRect(page, '#file-drop-enabled-with-error');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('hides file drop without error message', async function() {
		const rect = await visualDiff.getRect(page, '#file-drop-disabled-no-error');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

	it('hides file drop with error message', async function() {
		const rect = await visualDiff.getRect(page, '#file-drop-disabled-with-error');
		await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
	});

});
