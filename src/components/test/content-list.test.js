import { expect, fixture, html } from '@open-wc/testing';
import '../content-list.js';

const normalFixture = html`<content-list></content-list>`;

describe('d2l-content-store', () => {
	describe('accessibility', () => {
		it('passes all aXe tests (normal)', async() => {
			const el = await fixture(normalFixture);
			await expect(el).to.be.accessible();
		});

		it('passes all aXe tests (disabled)', async() => {
			const el = await fixture(html`<d2l-button-icon disabled icon="d2l-tier1:gear" text="Icon Button"></d2l-button-icon>`);
			await expect(el).to.be.accessible();
		});
	});
});
