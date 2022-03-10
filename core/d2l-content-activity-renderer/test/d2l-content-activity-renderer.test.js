import '../d2l-content-activity-renderer.js';
import { expect, fixture, html } from '@open-wc/testing';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';

describe('ContentActivityRenderer', () => {

	describe('accessibility', () => {
		it('should pass all aXe tests', async() => {
			const el = await fixture(html`<d2l-content-activity-renderer></d2l-content-activity-renderer>`);
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('d2l-content-activity-renderer');
		});
	});

});
