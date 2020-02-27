import { expect, fixture, html } from '@open-wc/testing';
import '../content-list.js';

describe('content-list', () => {
	const testContentItems = [
		{
			id: 'some-id',
			revisionId: 'some-rev-id',
			lastRevType: 'scorm',
			createdAt: '2020-02-21T17:42:42.679Z"'
		},
		{
			id: 'some-other-id',
			revisionId: 'some-other-rev-id',
			lastRevType: 'video',
			createdAt: '2020-01-21T17:42:42.679Z"'
		}
	];
	let el;

	beforeEach(async() => {
		el = await fixture(html`<content-list></content-list>`);
		await el.updateComplete;
	});

	it('passes all aXe tests with content items', async() => {
		el.loading = false;
		el.contentItems = testContentItems;
		await el.updateComplete;
		await expect(el).to.be.accessible();
	});

	it('passes all aXe tests with no results', async() => {
		el.loading = false;
		await el.updateComplete;
		await expect(el).to.be.accessible();
	});

	it('passes all aXe tests while loading', async() => {
		el.loading = true;
		await el.updateComplete;
		await expect(el).to.be.accessible();
	});
});
