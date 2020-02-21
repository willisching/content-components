import { expect, fixture, html } from '@open-wc/testing';
import '../d2l-content-store.js';

describe('d2l-content-store', () => {
	describe('accessibility', () => {
		it('passes all aXe tests (normal)', async() => {
			const el = await fixture(html`<d2l-content-store></d2l-content-store>`);
			await expect(el).to.be.accessible();
		});
	});
});
