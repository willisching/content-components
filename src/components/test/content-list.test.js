import { expect, fixture, html } from '@open-wc/testing';
import '../content-list.js';

describe('content-list', () => {
	describe('accessibility', () => {
		it('passes all aXe tests (normal)', async() => {
			const el = await fixture(html`<content-list></content-list>`);
			await expect(el).to.be.accessible();
		});
	});
});
