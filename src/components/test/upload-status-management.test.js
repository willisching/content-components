import { expect, fixture, html } from '@open-wc/testing';
import '../upload-status-management.js';

describe('upload-status-management', () => {
	let element;
	const uploadObject1 = { file: { name: 'Short name' }, progress: 34, error: {} };
	const uploadObject2 = { file: { name: 'Short' }, progress: 0 };
	const uploadObject3 = { file: { name: 'A_copy_RuntimeBasicCalls_SCORM20043rdEdition copy 2.zip' }, error: {} };
	const uploadObject4 = { file: { name: 'A_copy_RuntimeBasicCalls_SCORM20043rdEdition copy 2.zip' }, progress: 100 };
	const uploadObject5 = { file: { name: 'A_copy_RuntimeBasicCalls_SCORM20043rdEdition copy 2.zip' }, progress: 1 };

	describe('accessibility', () => {
		beforeEach(async() => {
			element = await fixture(html`<upload-status-management id="upload-status-management"></upload-status-management>`);
			element.show();
			await element.updateComplete;
		});

		it('passes all aXe tests with single object', async() => {
			element.uploader.uploads = [uploadObject1];
			await element.updateComplete;
			await expect(element).to.be.accessible();
		});

		it('passes all aXe tests with scrollable objects', async() => {
			element.uploader.uploads = [uploadObject1, uploadObject2, uploadObject3, uploadObject4, uploadObject5];
			await element.updateComplete;
			await expect(element).to.be.accessible();
		});
	});
});
