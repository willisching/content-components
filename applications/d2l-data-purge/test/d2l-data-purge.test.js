import '../d2l-data-purge.js';
import { expect, fixture, html } from '@open-wc/testing';

import ContentApi from '../../../node_modules/@d2l/content-service-shared-utils/lib/apis/content-api.js';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';
import SearchApi from '../../../node_modules/@d2l/content-service-shared-utils/lib/apis/search-api.js';
import Sinon from 'sinon';

const waitFinishLoading = async(elem) => new Promise(resolve => {
	const waitTime = 200;
	const interval = setInterval(() => {
		if (!elem._isLoading) {
			clearInterval(interval);
			resolve();
		}
	}, waitTime);
});

describe('DataPurge', () => {
	let searchStub, deleteStub, getItemStub, getTopicsStub;
	let el;
	beforeEach(async() => {
		searchStub = Sinon.stub(SearchApi.prototype, 'searchContent');
		searchStub.resolves({
			'hits': {
				'total': 2,
				'hits': [
					{
						'_source': {
							'lastRevType': 'Scorm',
							'lastRevTitle': 'quicktest12',
							'id': 'fake-id-1',
							'ownerId': '169',
						}
					},
					{
						'_source': {
							'lastRevType': 'Mp4',
							'lastRevTitle': 'sample-mixed-video.mp4',
							'id': 'fake-id-2',
							'ownerId': '169',
						}
					}
				]
			}
		});

		deleteStub = Sinon.stub(ContentApi.prototype, 'deleteItem');
		deleteStub.resolves();

		getItemStub = Sinon.stub(ContentApi.prototype, 'getItem');
		getItemStub.resolves({
			'revisions': [
				{
					'id': 'fake-revision-id-1',
					'type': 'Scorm',
				}
			],
		});

		getTopicsStub = Sinon.stub(ContentApi.prototype, 'getAssociatedTopics');
		getTopicsStub.resolves([
			{
				'contextId': '6606',
				'contexts': {
					'6606': {
						'resourceLinkTitle': 'quicktest12'
					}
				},
				'id': '10097701',
				'revisionTag': 'latest',
			}
		]);

		el = await fixture(html`<d2l-data-purge
			service-url="http://localhost:8000/contentservice"
			tenant-id="fake-tenant-id"
		></d2l-data-purge>`);
		await waitFinishLoading(el);
	});

	afterEach(() => {
		searchStub.restore();
		deleteStub.restore();
		getItemStub.restore();
		getTopicsStub.restore();
	});

	describe('accessibility', () => {
		it('should pass all aXe tests', async() => {
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('d2l-data-purge');
		});
	});

	describe('d2l-data-purge', () => {
		it('should delete when clicked', async() => {
			const input = el.shadowRoot.querySelector('#input-search');
			input.value = '169';
			const filterButton = el.shadowRoot.querySelector('#filter-button');
			filterButton.click();
			Sinon.assert.calledWith(searchStub, Sinon.match({
				ownerId: '169',
				start: 0,
				size: 10,
				clientApps: 'all',
			}));
			await waitFinishLoading(el);
			const deleteButton = el.shadowRoot.querySelector('.delete-action');
			deleteButton.click();
			Sinon.assert.calledWith(deleteStub, Sinon.match({
				id: 'fake-id-1',
				hardDelete: true
			}));
		});

		it('should select revision', async() => {
			const input = el.shadowRoot.querySelector('#input-search');
			input.value = '169';
			const filterButton = el.shadowRoot.querySelector('#filter-button');
			filterButton.click();
			await waitFinishLoading(el);
			const link = el.shadowRoot.querySelector('d2l-link');
			link.click();
			Sinon.assert.calledWith(getItemStub, Sinon.match({ id: 'fake-id-1' }));
			await waitFinishLoading(el);
			const dropdownItem = el.shadowRoot.querySelector('d2l-menu-item');
			dropdownItem.click();
			Sinon.assert.calledWith(getTopicsStub, Sinon.match({
				id: 'fake-id-1',
				revisionTag: 'latest'
			}));
		});
	});
});
