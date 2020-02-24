import { expect, fixture, html } from '@open-wc/testing';
import '../content-page.js';

describe('content-page', () => {
	it('passes all aXe tests (normal)', async() => {
		const el = await fixture(html`<content-page></content-page>`);
		await expect(el).to.be.accessible();
	});
});
