import '../d2l-content-selector.js';
import { assert, expect, fixture, html, oneEvent } from '@open-wc/testing';
import ContentApi from '../../../node_modules/@d2l/content-service-shared-utils/lib/apis/content-api';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';
import SearchApi from '../../../node_modules/@d2l/content-service-shared-utils/lib/apis/search-api';
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

function generateHits(id, searchedItem) {
	return {
		'_source': {
			'createdAt': '2022-05-03T21:55:24.308Z',
			'processingStatus': 'ready',
			'lastRevType': 'Scorm',
			'lastRevTitle': `${searchedItem}${id}`,
			'lastRevStorageVersion': 2,
			'tenantId': '97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7',
			'lastRevId': `${id}`,
			'id': `${id}`,
			'ownerId': '169',
			'sharedWith': ['ou:6606'],
			'storageId': `${id}`,
			'updatedAt': '2022-05-03T21:58:01.203Z'
		},
	};
}

let start = 0;

function generateSample(numItems, searchedItem = 'quicktest') {
	const hits = [];
	for (let i = 0; i < numItems; i++) {
		hits.push(generateHits(i + start, searchedItem));
	}
	const numHits = hits.length;
	start += numItems;

	return {
		'took': 5,
		'timed_out': false,
		'_shards': { 'total': numHits, 'successful': numHits, 'skipped': 0, 'failed': 0 },
		'hits': {
			'total': numHits,
			'max_score': null,
			'hits': hits,
		}
	};
}

describe('ContentSelector', async() => {

	let el, searchStub, getItemStub;
	beforeEach(async() => {
		const commonSearch = {};
		searchStub = Sinon.stub(SearchApi.prototype, 'searchContent');
		searchStub.withArgs(Sinon.match({ query: '', ...commonSearch })).callsFake(() => {
			return generateSample(10);
		});
		searchStub.withArgs(Sinon.match({ query: 'hello', ...commonSearch })).callsFake(() => {
			return generateSample(10, 'hello');
		});
		getItemStub = Sinon.stub(ContentApi.prototype, 'getItem');
		getItemStub.returns({
			id: '0',
			title: 'Package title',
			description: 'Package description',
			sharedWith: ['ou:6606'],
			revisions: [{
				id: '0',
				options: {
					playerShowNavBar: false,
					reviewRetake: true,
					recommendedPlayer: 1,
				},
				type: 'Scorm',
			}, {
				id: '1',
				options: {
					playerShowNavBar: false,
					reviewRetake: true,
					recommendedPlayer: 1,
				},
				type: 'Scorm',
			}]
		});
		el = await fixture(html`<d2l-content-selector
			allowExistingObjectSelection
			allow-upload
			.canShareTo=${[{ 'id': '6606', 'name': 'Dev' }, { 'id': '6609', 'name': 'Prod' }]}
			can-manage-all-objects
			can-select-share-location
			context="6606"
			max-file-upload-size="2147483648"
			.searchLocations=${[{ 'id': '6606', 'name': 'Dev' }, { 'id': '6609', 'name': 'Prod' }, { 'id': '1234', 'name': 'Custom' }]}
			tenant-id="0"
			user-id="169"
		></d2l-content-selector>`);
		const selectorList = el.shadowRoot.querySelector('d2l-content-selector-list');
		await waitFinishLoading(selectorList);
	});

	afterEach(() => {
		getItemStub.restore();
		searchStub.restore();
		start = 0;
	});

	describe('accessibility', () => {
		it('should pass all aXe tests', async() => {
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('d2l-content-selector');
		});
	});

	describe('d2l-content-selector', async() => {
		it('should change view to topic settings when item selected', async() => {
			const selectorList = el.shadowRoot.querySelector('d2l-content-selector-list');
			const radioButton = selectorList.shadowRoot.querySelector('.d2l-input-radio');

			setTimeout(() => radioButton.click());
			await oneEvent(selectorList, 'object-selected');
			await selectorList.updateComplete;
			const selectedContentId = selectorList.selectedContent.id;

			const next = el.shadowRoot.querySelector('#selector-list-next').shadowRoot.querySelector('button');
			setTimeout(() => next.click());
			await oneEvent(el, 'change-view-topic-settings');
			await el.updateComplete;

			const topicSettings = el.shadowRoot.querySelector('d2l-content-topic-settings');
			assert.isNotNull(topicSettings);
			assert.equal(topicSettings.contentId, selectedContentId);

			// test the back button
			const back = el.shadowRoot.querySelector('#topic-settings-back');
			await back.updateComplete;
			back.shadowRoot.querySelector('button').click();

			await el.updateComplete;
			const reloadedSelectorList = el.shadowRoot.querySelector('d2l-content-selector-list');
			assert.isNotNull(reloadedSelectorList);

			await oneEvent(reloadedSelectorList, 'content-loaded');
		});

		it('should change view to uploader when upload button clicked', async() => {
			const selectorList = el.shadowRoot.querySelector('d2l-content-selector-list');
			const uploadButton = selectorList.shadowRoot.querySelector('#upload-button').shadowRoot.querySelector('button');

			setTimeout(() => uploadButton.click());
			await oneEvent(selectorList, 'on-upload-button-click');
			await el.updateComplete;

			const uploader = el.shadowRoot.querySelector('d2l-drop-uploader');
			assert.isNotNull(uploader);

			// test the back button
			const back = el.shadowRoot.querySelector('#uploader-back');
			await back.updateComplete;
			back.shadowRoot.querySelector('button').click();

			await el.updateComplete;
			const reloadedSelectorList = el.shadowRoot.querySelector('d2l-content-selector-list');
			assert.isNotNull(reloadedSelectorList);
			await oneEvent(reloadedSelectorList, 'content-loaded');
		});

		it('should change view to properties when edit properties button clicked', async() => {
			const selectorList = el.shadowRoot.querySelector('d2l-content-selector-list');
			const editPropertiesButton = selectorList.shadowRoot.querySelector('.edit-properties');
			setTimeout(() => editPropertiesButton.click());
			await oneEvent(selectorList, 'show-edit-properties');
			await el.updateComplete;

			const properties = el.shadowRoot.querySelector('d2l-content-properties');
			assert.isNotNull(properties);

			// test the back button
			const back = el.shadowRoot.querySelector('#properties-back');
			await back.updateComplete;
			back.shadowRoot.querySelector('button').click();

			await el.updateComplete;
			const reloadedSelectorList = el.shadowRoot.querySelector('d2l-content-selector-list');
			assert.isNotNull(reloadedSelectorList);

			await oneEvent(reloadedSelectorList, 'content-loaded');
		});
	});
});
