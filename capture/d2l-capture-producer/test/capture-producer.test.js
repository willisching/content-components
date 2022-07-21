import '../d2l-capture-producer.js';
import { expect, fixture, html } from '@open-wc/testing';

import { BrightspaceApiClient } from '@d2l/content-service-api-client';
import ContentApi from '../../../node_modules/@d2l/content-service-api-client/lib/apis/content-api';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';
import Sinon from 'sinon';

describe('d2l-capture-producer', () => {
	let el, getItemStub, getResourceStub, getLocaleStub;
	beforeEach(async() => {
		getItemStub = Sinon.stub(ContentApi.prototype, 'getItem');
		getResourceStub = Sinon.stub(ContentApi.prototype, 'getResource');
		getLocaleStub = Sinon.stub(BrightspaceApiClient.prototype, 'getLocales');
		const sampleGetItem = {
			id: '0',
			title: 'Package title',
			description: 'Package description',
			sharedWith: ['ou:6606'],
			clientApp: 'LmsContent',
			revisions: [{
				options: {
					playerShowNavBar: false,
					reviewRetake: true,
					recommendedPlayer: 1,
				},
				type: 'Video',
				id: '0',
				processingFailed: false,
				ready: true,
				formats: ['hd', 'sd']
			}]
		};
		const sampleGetResourceOriginal = {
			'value': 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
			'expireTime': 999999999
		};
		const sampleGetResourceMetadata = {
			cuts: [],
			chapters: [],
		};
		const sampleGetLocales = [
			{ CultureCode: 'en-US', LocaleName: 'English (United States)', AutoCaptions: true, IsDefault: true }
		];
		getItemStub.returns(sampleGetItem);
		getLocaleStub.returns(sampleGetLocales);
		getResourceStub.withArgs(Sinon.match({
			resource: 'original',
		})).returns(sampleGetResourceOriginal);
		getResourceStub.withArgs(Sinon.match({
			resource: 'metadata',
		})).returns(sampleGetResourceMetadata);
		el = await fixture(html`<d2l-capture-producer
			endpoint='http://localhost:8000/contentservice'
			tenant-id='0'
			content-id='0'
		></d2l-capture-producer>`);
	});

	afterEach(() => {
		getItemStub.restore();
		getLocaleStub.restore();
		getResourceStub.restore();
	});

	describe('accessibility', () => {
		it('should pass all axe tests', async() => {
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('d2l-capture-producer');
		});
	});

});
