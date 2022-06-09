import '../d2l-content-topic-settings.js';
import { assert, expect, fixture, html } from '@open-wc/testing';

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

describe('ContentTopicSettings', async() => {

	let el, getItemStub, sampleItem;
	beforeEach(async() => {
		getItemStub = Sinon.stub(ContentApi.prototype, 'getItem');
		sampleItem = {
			id: '123',
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
		};
		getItemStub.returns(sampleItem);
		el = await fixture(html`
		<d2l-content-topic-settings
			d2lrn='d2l:brightspace:content:region:0:scorm:0'
			serviceUrl='http://localhost:8000/contentservice'
			context='0'
			topicId='0'
			revisionTag='0'
		></d2l-content-topic-settings>`);
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
			runConstructor('d2l-content-topic-settings');
			Sinon.assert.calledWith(getItemStub, Sinon.match({ id: '0' }));
		});
	});

	describe('d2l-content-topic-settings getContent', () => {
		it('getContent', () => {
			const actual = el.getContent();
			assert.equal(actual.topic.revisionTag, 'latest');
			assert.equal(actual.topic.gradeCalculationMethod, 'Highest');
			assert.equal(actual.topic.gradeObjectAssociation, true);
			assert.equal(actual.topic.selectedPlayer, 'NewWindowPlayer');
		});

		it('should change based on inputs', () => {
			const createGradeItemElem = el.shadowRoot.querySelector('#create-grade-item-no');
			createGradeItemElem.checked = true;
			dispatchEvent(createGradeItemElem, 'change', true);
			const versionControlElem = el.shadowRoot.querySelector('#this-version');
			versionControlElem.checked = true;
			dispatchEvent(versionControlElem, 'change', true);
			const selectPlayerElem = el.shadowRoot.querySelector('#player-options');
			selectPlayerElem.value = '1';
			dispatchEvent(selectPlayerElem, 'change', true);
			const gradingMethodItemsElem = el.shadowRoot.querySelectorAll('d2l-menu-item')[2];
			gradingMethodItemsElem.click();

			const actual = el.getContent();
			assert.equal(actual.topic.revisionTag, '0');
			assert.equal(actual.topic.gradeCalculationMethod, 'Average');
			assert.equal(actual.topic.gradeObjectAssociation, false);
			assert.equal(actual.topic.selectedPlayer, 'EmbeddedPlayer');
		});
	});
});
