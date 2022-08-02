import '../d2l-content-topic-settings.js';
import { expect, fixture, html } from '@open-wc/testing';

import ContentApi from '../../../node_modules/@d2l/content-service-shared-utils/lib/apis/content-api';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';
import Sinon from 'sinon';

function dispatchEvent(elem, eventType, composed) {
	const e = new Event(
		eventType,
		{ bubbles: true, cancelable: false, composed: composed }
	);
	elem.dispatchEvent(e);
}

const CONTEXT = '6609';
const CONTENT_ID = '123';
const TITLE = 'Package title';
const REVISIONS = [{
	id: 'revision0',
	options: {
		playerShowNavBar: false,
		reviewRetake: true,
		recommendedPlayer: 1,
	},
	type: 'Scorm',
}, {
	id: 'revision1',
	options: {
		playerShowNavBar: false,
		reviewRetake: true,
		recommendedPlayer: 1,
	},
	type: 'Scorm',
}];

describe('ContentTopicSettings', async() => {

	let el, getItemStub, sampleItem;
	beforeEach(async() => {
		getItemStub = Sinon.stub(ContentApi.prototype, 'getItem');
		sampleItem = {
			id: CONTENT_ID,
			title: TITLE,
			description: 'Package description',
			sharedWith: ['ou:6606'],
			revisions: REVISIONS
		};
		getItemStub.returns(sampleItem);
		el = await fixture(html`
		<d2l-content-topic-settings
			d2lrn='d2l:brightspace:content:region:0:scorm:${CONTENT_ID}'
			serviceUrl='http://localhost:8000/contentservice'
			context='${CONTEXT}'
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
			Sinon.assert.calledWith(getItemStub, Sinon.match({ id: CONTENT_ID }));
		});
	});

	describe('d2l-content-topic-settings getContent', () => {
		it('getContent', () => {
			const actual = el.getSettings();
			expect(actual).to.deep.include({
				contentId: CONTENT_ID,
				revisionTag: 'latest',
				resourceType: 'scorm',
				openInNewWindow: false,
				title: TITLE,
				gradeCalculationMethod: 'Highest',
				gradeObjectAssociation: true
			});
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

			const actual = el.getSettings();
			expect(actual).to.deep.include({
				contentId: CONTENT_ID,
				revisionTag: REVISIONS[1].id,
				resourceType: 'scorm',
				openInNewWindow: false,
				title: TITLE,
				gradeCalculationMethod: 'Average',
				gradeObjectAssociation: false
			});
		});
	});
});
