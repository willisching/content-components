import '../d2l-content-media-player.js';
import { assert, expect, fixture, html } from '@open-wc/testing';

import ContentApi from '../../../node_modules/@d2l/content-service-shared-utils/lib/apis/content-api';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';
import Sinon from 'sinon';

const VIDEO_SOURCE = 'https://d2l-content-test-files.s3.amazonaws.com/sample.mp3';
const AUDIO_SOURCE = 'https://d2l-content-test-files.s3.amazonaws.com/sample-audio.mp3';

function dispatchEvent(elem, eventType, composed) {
	const e = new Event(
		eventType,
		{ bubbles: true, cancelable: false, composed: composed }
	);
	elem.dispatchEvent(e);
}

describe('ContentMediaPlayer', () => {
	describe('d2l-content-media-player video', () => {
		let el, getResourceStub, getRevisionStub;
		beforeEach(async() => {
			getResourceStub = Sinon.stub(ContentApi.prototype, 'getResource');
			getRevisionStub = Sinon.stub(ContentApi.prototype, 'getRevision');
			getResourceStub.withArgs(Sinon.match({ resource: 'transcodes' })).returns({
				value: VIDEO_SOURCE
			});
			getResourceStub.withArgs(Sinon.match({ resource: 'captions' })).returns([]);
			getResourceStub.withArgs(Sinon.match({ resource: 'metadata' })).returns({});
			getResourceStub.withArgs(Sinon.match({ resource: 'poster' })).returns({});
			getResourceStub.withArgs(Sinon.match({ resource: 'thumbnails' })).returns({});

			getRevisionStub.withArgs(Sinon.match({ id: '0', revisionTag: 'latest' })).returns({
				title: 'Title',
				description: 'Description',
				formats: ['ld', 'sd', 'hd'],
				type: 'Video',
				ready: true,
			});

			el = await fixture(html`<d2l-content-media-player
				allow-download
				allow-download-on-error
				content-service-endpoint="http://localhost:8000/contentservice"
				context-id="12345"
				context-type="topic"
				d2lrn="d2l:brightspace:content:region:0:video:0"
			></d2l-content-media-player>`);
		});

		afterEach(() => {
			getResourceStub.restore();
			getRevisionStub.restore();
		});

		describe('accessibility', () => {
			it('should pass all aXe tests', async() => {
				await expect(el).to.be.accessible();
			});
		});

		describe('constructor', () => {
			it('should construct', () => {
				runConstructor('d2l-content-media-player');
			});
		});

		describe('d2l-content-media-player video', async() => {
			it('has a download button', async() => {
				const downloadButton = el.shadowRoot.querySelector('#download-menu-item');
				assert.isNotNull(downloadButton);

				// TODO: see if download works when clicked. Can't seem to mock this properly
			});

			it('should have appropriate properties', async() => {
				assert.equal(el._bestFormat, 'hd');
				expect(el._captionSignedUrls).to.deep.equal([]);
				expect(el._mediaSources).to.deep.equal([{ src: VIDEO_SOURCE, format: 'ld' }, { src: VIDEO_SOURCE, format: 'sd' }, { src: VIDEO_SOURCE, format: 'hd' }]);
				assert.equal(el._metadata, '{}');

				// TODO: verify d2l-labs-media-player has the correct properties
			});

			it('should reload media on error', async() => {
				getResourceStub.resetHistory();
				const mediaPlayer = el.shadowRoot.querySelector('#player');
				dispatchEvent(mediaPlayer, 'error', false);
				Sinon.assert.called(getResourceStub);
				const numCalls = getResourceStub.callCount;
				dispatchEvent(mediaPlayer, 'error', false);
				Sinon.assert.callCount(getResourceStub, numCalls);
				// TODO: verify that the d2l-labs-media-player is configured with new media sources/captions
			});

			it('should reload captions on failure', async() => {
				const mediaPlayer = el.shadowRoot.querySelector('#player');
				dispatchEvent(mediaPlayer, 'trackloadfailed', false);
				Sinon.assert.called(getResourceStub);
			});
		});
	});

	describe('d2l-content-media-player audio', async() => {
		let el, getResourceStub, getRevisionStub;
		beforeEach(async() => {
			getResourceStub = Sinon.stub(ContentApi.prototype, 'getResource');
			getRevisionStub = Sinon.stub(ContentApi.prototype, 'getRevision');
			getResourceStub.withArgs(Sinon.match({ resource: 'transcodes' })).returns({
				value: AUDIO_SOURCE
			});
			getResourceStub.withArgs(Sinon.match({ resource: 'captions' })).returns([]);
			getResourceStub.withArgs(Sinon.match({ resource: 'metadata' })).returns({});
			getResourceStub.withArgs(Sinon.match({ resource: 'poster' })).returns({});
			getResourceStub.withArgs(Sinon.match({ resource: 'thumbnails' })).returns({});

			getRevisionStub.withArgs(Sinon.match({ id: '1', revisionTag: 'latest' })).returns({
				title: 'Title',
				description: 'Description',
				type: 'Audio',
				ready: true,
			});

			el = await fixture(html`<d2l-content-media-player
				content-service-endpoint="http://localhost:8000/contentservice"
				content-id="1"
				context-id="12345"
				context-type="topic"
				d2lrn="d2l:brightspace:content:region:0:audio:1"
				revision-tag="latest"
				tenant-id="0"
			></d2l-content-media-player>`);
		});

		afterEach(() => {
			getResourceStub.restore();
			getRevisionStub.restore();
		});

		describe('accessibility', () => {
			it('should pass all aXe tests', async() => {
				await expect(el).to.be.accessible();
			});
		});

		describe('constructor', () => {
			it('should construct', () => {
				runConstructor('d2l-content-media-player');
			});
		});

		describe('d2l-content-media-player video', async() => {
			it('does not get thumbnails, posters, metadata', async() => {
				Sinon.assert.neverCalledWithMatch(getResourceStub, Sinon.match({ resource: 'metadata' }));
				Sinon.assert.neverCalledWithMatch(getResourceStub, Sinon.match({ resource: 'poster' }));
				Sinon.assert.neverCalledWithMatch(getResourceStub, Sinon.match({ resource: 'thumbnails' }));
			});

			it('does not have a download button', async() => {
				const downloadButton = el.shadowRoot.querySelector('#download-menu-item');
				assert.isNull(downloadButton);
			});

			it('should have appropriate properties', async() => {
				expect(el._captionSignedUrls).to.deep.equal([]);
				expect(el._mediaSources).to.deep.equal([{ src: AUDIO_SOURCE, format: undefined }]);
			});

			it('should reload media on error', async() => {
				getResourceStub.resetHistory();
				const mediaPlayer = el.shadowRoot.querySelector('#player');
				dispatchEvent(mediaPlayer, 'error', false);
				Sinon.assert.called(getResourceStub);
				const numCalls = getResourceStub.callCount;
				dispatchEvent(mediaPlayer, 'error', false);
				Sinon.assert.callCount(getResourceStub, numCalls);
			});

			it('should reload captions on failure', async() => {
				const mediaPlayer = el.shadowRoot.querySelector('#player');
				dispatchEvent(mediaPlayer, 'trackloadfailed', false);
				Sinon.assert.called(getResourceStub);
			});
		});
	});
});
