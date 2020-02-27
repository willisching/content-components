import { expect, fixture, html } from '@open-wc/testing';
import '../content-list-item.js';

describe('content-list-item', () => {
	const id = 'some-id';
	const revisionId = 'some-rev-id';
	const type = 'some-type';
	let el;

	beforeEach(async() => {
		el = await fixture(html`<content-list-item></content-list-item>`);
		el.id = id;
		el.revisionId = revisionId;
		el.type = type;
		await el.updateComplete;
	});

	it('passes all aXe tests (normal)', async() => {
		await expect(el).to.be.accessible();
	});

	it('passes all aXe tests with dropdown menu opened', async() => {
		const dropdownMore = el.shadowRoot.querySelector('d2l-dropdown-more');
		const dropdownMenu = el.shadowRoot.querySelector('d2l-dropdown-menu');

		expect(dropdownMenu.opened).to.be.false;

		dropdownMore.click();
		dropdownMenu.setAttribute('opened', true);
		await el.updateComplete;

		expect(dropdownMenu.opened).to.be.true;
		await expect(el).to.be.accessible();
	});
});
