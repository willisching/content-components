import { expect, fixture, html } from '@open-wc/testing';
import '../trash-page.js';

describe('trash-page', () => {
	it('passes all aXe tests (normal)', async() => {
		const el = await fixture(html`<trash-page></trash-page>`);
		await expect(el).to.be.accessible();
	});
});
