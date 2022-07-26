import '../d2l-content-selector-list.js';
import { assert, expect, fixture, html, oneEvent } from '@open-wc/testing';

import ContentApi from '../../../node_modules/@d2l/content-service-api-client/lib/apis/content-api';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';
import SearchApi from '../../../node_modules/@d2l/content-service-api-client/lib/apis/search-api';
import Sinon from 'sinon';

// https://stackoverflow.com/questions/4620906/how-do-i-know-when-ive-stopped-scrolling
// function waitForScrollEnd(element) {
// 	let last_changed_frame = 0;
// 	let last_x = element.scrollX;
// 	let last_y = element.scrollY;

// 	return new Promise(resolve => {
// 		function tick(frames) {
// 			// no change have been observed.
// 			if (frames - last_changed_frame > 200) {
// 				resolve();
// 			} else {
// 				if (element.scrollX !== last_x || element.scrollY !== last_y) {
// 					last_changed_frame = frames;
// 					last_x = element.scrollX;
// 					last_y = element.scrollY;
// 				}
// 				setTimeout(tick.bind(null, frames + 100), 100);
// 			}
// 		}
// 		tick(-100);
// 	});
// }

// const sleep = ms => new Promise(r => setTimeout(r, ms));

// const waitForStubCall = async(stub, numCalls) => new Promise((resolve) => {
// 	let numSeconds = 0;
// 	const interval = setInterval(() => {
// 		if (numSeconds > 5000 || stub.callCount >= numCalls) {
// 			clearInterval(interval);
// 			resolve();
// 		}
// 		numSeconds += 200;
// 	}, 200);
// });

const waitFinishLoading = async(elem) => new Promise(resolve => {
	const waitTime = 200;
	const interval = setInterval(() => {
		if (!elem._isLoading) {
			clearInterval(interval);
			resolve();
		}
	}, waitTime);
});

const waitForStubSilent = async(stub, msec) => new Promise((resolve) => {
	const waitTime = 200;
	let numSeconds = 0;
	let prevCallCount = stub.callCount;
	const interval = setInterval(() => {
		if (numSeconds > msec) {
			clearInterval(interval);
			resolve();
		} else if (prevCallCount !== stub.callCount) {
			numSeconds = 0;
			prevCallCount = stub.callCount;
		} else {
			numSeconds += waitTime;
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

describe('ContentSelectorList', async() => {

	let deleteItemStub, el, searchStub;
	beforeEach(async() => {
		const ou1 = '312';
		const ou2 = '645';
		const commonSearch = { searchLocations: `ou:${ou1},ou:${ou2}` };
		searchStub = Sinon.stub(SearchApi.prototype, 'searchContent');
		deleteItemStub = Sinon.stub(ContentApi.prototype, 'deleteItem');
		searchStub.withArgs(Sinon.match({ query: '', ...commonSearch })).callsFake(() => {
			return generateSample(10);
		});
		searchStub.withArgs(Sinon.match({ query: 'hello', ...commonSearch })).callsFake(() => {
			return generateSample(10, 'hello');
		});
		el = await fixture(html`
		<d2l-content-selector-list
			allowUpload
			allowSelection
			tenantId="0"
			.searchLocations=${[{ id: ou1 }, { id: ou2 }]}
			serviceUrl="http://localhost:8000/contentservice"
			showPreviewAction
			showDeleteAction
			showRevisionUploadAction
			showEditPropertiesAction
		></d2l-content-selector-list>`);
		await waitFinishLoading(el);
	});

	afterEach(() => {
		searchStub.restore();
		deleteItemStub.restore();
		start = 0;
	});

	describe('accessibility', () => {
		it('should pass all aXe tests', async() => {
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('d2l-content-selector-list');
			Sinon.assert.calledWith(searchStub, Sinon.match({
				query: '',
				start: 0,
				sort: 'updatedAt:desc',
				size: 10,
			}));
		});
	});

	describe('d2l-content-selector-list', async() => {
		it('should emit events', async() => {
			const d2lMenu = el.shadowRoot.querySelector('d2l-menu');
			const previewElem = d2lMenu.querySelector('d2l-menu-item.preview');
			const editPropertiesElem = d2lMenu.querySelector('d2l-menu-item.edit-properties');
			const revisionUploadElem = d2lMenu.querySelector('d2l-menu-item.revision-upload');
			const deleteElem = d2lMenu.querySelector('d2l-menu-item.delete-item');

			setTimeout(() => previewElem.click());
			await oneEvent(el, 'show-preview');

			setTimeout(() => editPropertiesElem.click());
			await oneEvent(el, 'show-edit-properties');

			setTimeout(() => revisionUploadElem.click());
			await oneEvent(el, 'revision-upload-requested');

			setTimeout(() => deleteElem.click());
			await oneEvent(el, 'd2l-dialog-open');
		});

		it('should refetch when search entered', async() => {
			const searchElem = el.shadowRoot.querySelector('d2l-input-search');
			searchElem.value = 'hello';
			const searchButton = searchElem.shadowRoot.querySelector('d2l-button-icon');
			searchButton.click();

			Sinon.assert.calledWith(searchStub, Sinon.match({
				query: 'hello',
				start: 0,
				sort: 'updatedAt:desc',
				size: 10,
			}));

			await oneEvent(el, 'content-loaded');

			const titleElem = el.shadowRoot.querySelector('.heading > .title-wrapper > .title');
			assert.isTrue(titleElem.textContent.trim().startsWith('hello'));
		});

		it('should not delete content until confirmed', async() => {
			const deleteElem = el.shadowRoot.querySelector('d2l-menu-item.delete-item');

			setTimeout(() => deleteElem.click());
			await oneEvent(el, 'd2l-dialog-open');

			const objectRadioButton = el.shadowRoot.querySelector('.d2l-input-radio');
			await waitForStubSilent(searchStub, 1000);
			const originalLength = el._contentItems.length;
			setTimeout(() => objectRadioButton.click());
			await oneEvent(el, 'object-selected');

			const previousLength = el._contentItems.length;
			assert.equal(previousLength, originalLength);

			const deleteButton = el.shadowRoot.querySelector('#delete-button');
			deleteButton.click();

			Sinon.assert.calledOnce(deleteItemStub);
			assert.equal(el._contentItems.length, previousLength - 1);
		});

		it('should not delete content when cancelled', async() => {
			const deleteElem = el.shadowRoot.querySelector('d2l-menu-item.delete-item');

			setTimeout(() => deleteElem.click());
			await oneEvent(el, 'd2l-dialog-open');

			const objectRadioButton = el.shadowRoot.querySelector('.d2l-input-radio');
			await waitForStubSilent(searchStub, 1000);
			const originalLength = el._contentItems.length;
			setTimeout(() => objectRadioButton.click());
			await oneEvent(el, 'object-selected');

			const previousLength = el._contentItems.length;
			assert.equal(previousLength, originalLength);

			const cancelButton = el.shadowRoot.querySelector('#cancel-button');
			cancelButton.click();

			Sinon.assert.notCalled(deleteItemStub);
			assert.equal(el._contentItems.length, previousLength);
		});

		// This test does not work with Safari. Intersection observer is not running the callback.
		// To reproduce: uncomment below and add a script in package.json:
		//	"web-test-runner --group default --playwright --browsers webkit"
		// expected: Scrolling down to the end should trigger more entries to be generated.
		//   When a new batch of entries is generated, the component will emit content-loaded event
		// actual: Scrolling down does not generate new entries. (only Safari)
		/*
		it('should infinite scroll', async() => {
			const scroller = el.shadowRoot.querySelector('d2l-scroller');
			const itemContainer = scroller.shadowRoot.querySelector('.item-container');
			const itemContainerSlot = itemContainer.querySelector('slot');

			const originalLength = itemContainerSlot.assignedNodes({ flatten: true }).length;
			searchStub.resetHistory();

			setTimeout(() => itemContainer.scroll({ top: 3000, left: 0 }));
			await oneEvent(el, 'content-loaded');

			const newLength = itemContainerSlot.assignedNodes({ flatten: true }).length;
			Sinon.assert.called(searchStub);
			assert.isTrue(newLength > originalLength);
		});
		*/
	});
});
