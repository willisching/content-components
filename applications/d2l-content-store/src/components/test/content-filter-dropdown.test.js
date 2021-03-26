import { expect, fixture, html } from '@open-wc/testing';
import '../content-filter-dropdown.js';

describe('content-filter-dropdown', () => {
	let el;

	beforeEach(async() => {
		el = await fixture(html`<content-filter-dropdown></content-filter-dropdown>`);
		await el.updateComplete;
	});

	it('passes all aXe tests (normal)', async() => {
		await expect(el).to.be.accessible();
	});

	it('passes all aXe tests with dropdown menu opened', async() => {
		const dropdownSubtle = el.shadowRoot.querySelector('d2l-dropdown-button-subtle');
		const dropdownContent = el.shadowRoot.querySelector('d2l-dropdown-content');

		expect(dropdownContent.opened).to.be.false;

		dropdownSubtle.click();
		dropdownContent.setAttribute('opened', true);
		await el.updateComplete;

		expect(dropdownContent.opened).to.be.true;
		await expect(el).to.be.accessible();
	});
});
