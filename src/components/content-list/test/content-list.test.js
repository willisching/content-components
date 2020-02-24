import { expect, fixture, html } from '@open-wc/testing';
import '../content-list.js';

describe('content-list', () => {
	it('passes all aXe tests (normal)', async() => {
		const el = await fixture(html`<content-list></content-list>`);
		el.contentItems = [
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
		await el.updateComplete;
		await expect(el).to.be.accessible();
	});
});
