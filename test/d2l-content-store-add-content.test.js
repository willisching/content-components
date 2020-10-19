import '../d2l-content-service-add-dialog.js';
import { expect, fixture, html } from '@open-wc/testing';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';

describe('d2l-labs-d2l-content-service-add-dialog', () => {

	describe('accessibility', () => {
		it('should pass all axe tests', async() => {
			const el = await fixture(html`<d2l-labs-d2l-content-service-add-dialog></d2l-labs-d2l-content-service-add-dialog>`);
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('d2l-labs-d2l-content-service-add-dialog');
		});
	});

});
