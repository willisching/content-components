import '../d2l-recycling-bin.js';
import { expect, fixture, html } from '@open-wc/testing';

import ContentApi from '../../../node_modules/@d2l/content-service-shared-utils/lib/apis/content-api.js';
import { D2LFetch } from 'd2l-fetch/src/d2lfetch.js';
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

describe('RecyclingBin', () => {
	let searchStub, updateStub, fetchStub;
	let el;
	beforeEach(async() => {
		searchStub = Sinon.stub(SearchApi.prototype, 'searchContent');
		searchStub.resolves({
			'hits': {
				'total': 3,
				'hits': [{
					'_source': {
						'id': 'fake-id',
						'ownerId': '169',
						'deletedByUserId': '169',
						'deletedAt': '2022-10-17T14:22:59.526Z',
						'lastRevTitle': 'quicktest',
					},
				}, {
					'_source': {
						'id': 'fake-id',
						'ownerId': '169',
						'deletedByUserId': '169',
						'deletedAt': '2022-10-17T14:22:37.913Z',
						'lastRevTitle': "Oh, It's a baseball",
					},
				}, {
					'_source': {
						'id': 'fake-id',
						'ownerId': '169',
						'deletedByUserId': '169',
						'deletedAt': '2022-10-17T14:22:28.142Z',
						'lastRevTitle': 'Golf',
					},
				}
				] }
		});
		updateStub = Sinon.stub(ContentApi.prototype, 'updateItem');
		fetchStub = Sinon.stub(D2LFetch.prototype, 'fetch');
		fetchStub.resolves({
			json: () => {
				return {
					FirstName: 'first',
					LastName: 'last'
				};
			}
		});
		el = await fixture(html`<d2l-recycling-bin
			service-url="http://localhost:8000/contentservice"
			tenant-id="fake-tenant-id"
			user-id="169"
		></d2l-recycling-bin>`);
		await waitFinishLoading(el);
	});

	afterEach(() => {
		searchStub.restore();
		updateStub.restore();
		fetchStub.restore();
	});

	describe('accessibility', () => {
		it('should pass all aXe tests', async() => {
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('d2l-recycling-bin');
		});
	});

	describe('d2l-recycling-bin', () => {
		it('should restore when clicked', async() => {
			const table = el.shadowRoot.querySelector('d2l-table-renderer');
			const restoreButton = table.shadowRoot.querySelector('d2l-button');
			restoreButton.click();
			Sinon.assert.calledWith(updateStub, Sinon.match({
				content: {
					id: 'fake-id',
					deletedAt: null
				}
			}));
		});
	});
});
