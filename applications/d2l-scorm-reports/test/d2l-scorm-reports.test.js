import '../d2l-scorm-reports.js';
import { assert, expect, fixture, html, oneEvent } from '@open-wc/testing';

import ReportsApi from '../../../node_modules/@d2l/content-service-shared-utils/lib/apis/reports-api';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';
import Sinon from 'sinon';

const waitElemRendered = async(root, query) => new Promise(resolve => {
	const waitTime = 200;
	const interval = setInterval(() => {
		const elem = root.shadowRoot.querySelector(query) ?? root.querySelector(query);
		if (elem !== null) {
			clearInterval(interval);
			resolve();
		}
	}, waitTime);
});

describe('ScormReports', () => {
	let getTopicSummaryStub;
	let getTopicDetailStub;
	let getUserSummaryStub;
	let getUserDetailStub;
	let getActivityStub;
	let getInteractionsStub;
	let getObjectivesStub;
	let el;
	beforeEach(async() => {
		getTopicSummaryStub = Sinon.stub(ReportsApi.prototype, 'getTopicSummary');
		getTopicSummaryStub.resolves({
			results: [
				{
					attempts: 1,
					averageScore: 0,
					averageTimeSpent: 35,
					completed: 0,
					passed: 0,
					title: 'Title',
					topicId: '10097706',
					type: 'Scorm',
				}
			]
		});
		getTopicDetailStub = Sinon.stub(ReportsApi.prototype, 'getTopicDetail');
		getTopicDetailStub.resolves({
			results: [
				{
					attempts: 1,
					completion: 'completed',
					firstName: 'First',
					lastAccessed: '2022-10-06T17:44:46.000Z',
					lastName: 'Last',
					lmsUserId: '30220',
					progress: null,
					score: 98,
					status: 'unknown',
					timeSpent: 9
				}
			]
		});
		getUserSummaryStub = Sinon.stub(ReportsApi.prototype, 'getUserSummary');
		getUserSummaryStub.resolves({
			results: [
				{
					lmsUserId: '30220',
					firstName: 'First',
					lastName: 'Last',
					attempts: 2
				}
			]
		});
		getUserDetailStub = Sinon.stub(ReportsApi.prototype, 'getUserDetail');
		getUserDetailStub.resolves({
			results: [
				{
					attempts: 1,
					completion: 'completed',
					lastAccessed: '2022-10-06T17:44:46.000Z',
					progress: null,
					score: 98,
					status: 'unknown',
					timeSpent: 9,
					title: 'quicktest12.zip',
					topicId: '10097707',
					type: 'Scorm'
				}
			]
		});
		getActivityStub = Sinon.stub(ReportsApi.prototype, 'getActivity');
		getActivityStub.resolves({
			results: [
				{
					completion: 'completed',
					id: '10097707-30220-43906b1f-0340-4eb3-8943-a0b69677deb1-1',
					lmsUserId: '30220',
					score: 98,
					status: 'unknown',
					timestamp: '2022-10-06T17:44:46.000Z',
					topicId: '10097707',
				}
			]
		});
		getInteractionsStub = Sinon.stub(ReportsApi.prototype, 'getInteractions');
		getInteractionsStub.resolves({
			results: [
				{
					internalId: 12345,
					interactionType: 'Interaction Type',
					description: 'Description',
					correctResponses: 10,
					learnerResponse: 'Learner Response',
					attempt: 1,
					result: 'Result',
					weighting: 1,
					latency: '000:00:00',
				}
			]
		});
		getObjectivesStub = Sinon.stub(ReportsApi.prototype, 'getObjectives');
		getObjectivesStub.resolves({
			results: [
				{
					internalId: 12345,
					description: 'Description',
					score: 1,
					status: 'status',
					progress: 'complete',
				}
			]
		});
		el = await fixture(html`<d2l-scorm-reports
			service-url="http://localhost:8000/contentservice"
			tenant-id="fake-tenant-id"
			context-id="6606"
		></d2l-scorm-reports>`);
	});

	afterEach(() => {
		getTopicSummaryStub.restore();
		getTopicDetailStub.restore();
		getUserSummaryStub.restore();
		getUserDetailStub.restore();
		getActivityStub.restore();
		getInteractionsStub.restore();
		getObjectivesStub.restore();
	});

	describe('accessibility', () => {
		it('should pass all aXe tests', async() => {
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('d2l-scorm-reports');
		});
	});

	describe('d2l-scorm-reports', () => {
		it('can navigate to activities from content tab and navigate activities', async() => {
			const topicSummary = el.shadowRoot.querySelector('d2l-topic-summary');
			const topicSummaryTable = topicSummary.shadowRoot.querySelector('d2l-table-renderer');
			await topicSummaryTable.updateComplete;
			const topicSummaryAnchor = topicSummaryTable.shadowRoot.querySelector('a');
			setTimeout(() => {
				topicSummaryAnchor.click();
				topicSummary._goToTopicDetails('topic-id', 'Title')();
			});
			await oneEvent(topicSummary, 'go-topic-detail');
			await el.updateComplete;

			const topicDetail = el.shadowRoot.querySelector('d2l-topic-detail');
			const topicDetailTable = topicDetail.shadowRoot.querySelector('d2l-table-renderer');
			await topicDetailTable.updateComplete;
			const topicDetailAnchor = topicDetailTable.shadowRoot.querySelector('a');
			setTimeout(() => {
				topicDetailAnchor.click();
				topicDetail._goToActivity('user-id', 'first', 'last')();
			});
			await oneEvent(topicDetail, 'go-activity');
			await el.updateComplete;

			const activity = el.shadowRoot.querySelector('d2l-activity');
			await activity.updateComplete;
			assert.isNotNull(activity);

			const activitySummary = activity.shadowRoot.querySelector('d2l-activity-summary');
			assert.isNotNull(activitySummary);

			const interactionsButton = activity.shadowRoot.querySelector('#interactions-button');
			setTimeout(() => {
				interactionsButton.click();
			});

			await activity.updateComplete;
			await waitElemRendered(activity, 'd2l-activity-interactions');

			const activityInteractions = activity.shadowRoot.querySelector('d2l-activity-interactions');
			assert.isNotNull(activityInteractions);

			const objectivesButton = activity.shadowRoot.querySelector('#objectives-button');
			setTimeout(() => {
				objectivesButton.click();
			});
			await activity.updateComplete;
			await waitElemRendered(activity, 'd2l-activity-objectives');

			const activityObjectives = activity.shadowRoot.querySelector('d2l-activity-objectives');
			assert.isNotNull(activityObjectives);

			const summaryButton = activity.shadowRoot.querySelector('#summary-button');
			setTimeout(() => {
				summaryButton.click();
			});
			await activity.updateComplete;
			await waitElemRendered(activity, 'd2l-activity-summary');

			const activitySummary2 = activity.shadowRoot.querySelector('d2l-activity-summary');
			assert.isNotNull(activitySummary2);
		});

		it('can navigate to activities from users tab', async() => {
			const userTabButton = el.shadowRoot.querySelector('#user-tab-button');
			userTabButton.click();
			await el.updateComplete;
			const userSummary = el.shadowRoot.querySelector('d2l-user-summary');
			const userSummaryTable = userSummary.shadowRoot.querySelector('d2l-table-renderer');
			await userSummaryTable.updateComplete;
			const userSummaryAnchor = userSummaryTable.shadowRoot.querySelector('a');
			setTimeout(() => {
				userSummaryAnchor.click();
				userSummary._goToUserDetails('user-id', 'first', 'last')();
			});
			await oneEvent(userSummary, 'go-user-detail');
			await el.updateComplete;

			const userDetail = el.shadowRoot.querySelector('d2l-user-detail');
			const userDetailTable = userDetail.shadowRoot.querySelector('d2l-table-renderer');
			await userDetailTable.updateComplete;
			const userDetailAnchor = userDetailTable.shadowRoot.querySelector('a');
			setTimeout(() => {
				userDetailAnchor.click();
				userDetail._goToActivity('user-id', 'first', 'last')();
			});
			await oneEvent(userDetail, 'go-activity');
			await el.updateComplete;

			const activity = el.shadowRoot.querySelector('d2l-activity');
			assert.isNotNull(activity);
		});
	});
});
