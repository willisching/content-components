import '../d2l-content-properties.js';
import { expect, fixture, html } from '@open-wc/testing';

import ContentApi from '../../../node_modules/d2l-content-service-api-client/lib/apis/content-api';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';
import Sinon from 'sinon';

function dispatchEvent(elem, eventType, composed) {
	const e = new Event(
		eventType,
		{ bubbles: true, cancelable: false, composed: composed }
	);
	elem.dispatchEvent(e);
}

describe('ContentProperties', async() => {

	let el, getItemStub, sampleItem;
	beforeEach(async() => {
		getItemStub = Sinon.stub(ContentApi.prototype, 'getItem');
		sampleItem = {
			title: 'Package title',
			description: 'Package description',
			sharedWith: ['ou:6606'],
			revisions: [{
				options: {
					playerShowNavBar: false,
					reviewRetake: true,
					recommendedPlayer: 1,
				},
				type: 'Scorm',
			}],
		};
		getItemStub.returns(sampleItem);
		el = await fixture(html`<d2l-content-properties
			d2lrn="d2l:brightspace:content:region:97dc5895-cd3b-465f-8d5b-3c8d7e1bb6a7:scorm:0"
			serviceUrl="http://localhost:8000/contentservice"
			.canShareTo=${[{ 'id': '6606', 'name': 'Dev' }, { 'id': '6609', 'name': 'Prod' }]}
			canSelectShareLocation
			embedFeatureEnabled
		></d2l-content-properties>`);
	});

	afterEach(() => {
		getItemStub.restore();
	});

	describe('accessibility', () => {
		it('should pass all aXe tests', async() => {
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('d2l-content-properties');
			Sinon.assert.calledWith(getItemStub, Sinon.match({ id: '0' }));
		});
	});

	describe('d2l-content-properties', () => {
		it('should call save', async() => {
			const updateItemStub = Sinon.stub(ContentApi.prototype, 'updateItem');
			await el.save();
			Sinon.assert.calledWith(updateItemStub, Sinon.match({ content: {
				title: 'Package title',
				description: 'Package description',
				sharedWith: ['ou:6606'],
			} }));
			updateItemStub.restore();
		});

		it('should save with changed input', async() => {
			const updateItemStub = Sinon.stub(ContentApi.prototype, 'updateItem');
			const newTitle = 'New Title';
			const newDescription = 'New Description';

			const packageNameInput = el.shadowRoot.querySelector('#package-name');
			packageNameInput.value = newTitle;
			dispatchEvent(packageNameInput, 'input', true);
			const packageDescriptionInput = el.shadowRoot.querySelector('#package-description');
			packageDescriptionInput.value = newDescription;
			dispatchEvent(packageDescriptionInput, 'input', true);
			const removeSharingElem = el.shadowRoot.querySelector('#remove-sharing');
			removeSharingElem.checked = true;
			dispatchEvent(removeSharingElem, 'change', true);
			const openNewWindowElem = el.shadowRoot.querySelector('#open-new-window');
			openNewWindowElem.checked = true;
			dispatchEvent(openNewWindowElem, 'change', true);
			const addNavElem = el.shadowRoot.querySelector('#add-navigation');
			addNavElem.checked = true;
			dispatchEvent(addNavElem, 'change', true);
			const addReviewRetakeElem = el.shadowRoot.querySelector('#do-not-add-review-retake');
			addReviewRetakeElem.checked = true;
			dispatchEvent(addReviewRetakeElem, 'change', true);

			await el.save();
			Sinon.assert.calledWith(updateItemStub, Sinon.match({ content: {
				title: newTitle,
				description: newDescription,
				sharedWith: [],
				revisions: [{
					options: {
						playerShowNavBar: true,
						reviewRetake: false,
						recommendedPlayer: 2,
					},
					type: 'Scorm',
				}],
			} }));
			updateItemStub.restore();
		});
	});
});
