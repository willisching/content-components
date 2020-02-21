import { expect, fixture, html } from '@open-wc/testing';
import '../d2l-content-store-manage.js';

describe('d2l-content-store-manage', () => {
	describe('accessibility', () => {
		it('passes all aXe tests (normal)', async() => {
			const el = await fixture(html`<d2l-content-store-manage></d2l-content-store-manage>`);
			await expect(el).to.be.accessible();
		});
	});
});
