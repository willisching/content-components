import '../d2l-content-media-player.js';
import { expect, fixture, html } from '@open-wc/testing';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';

describe('ContentMediaPlayer', () => {

	describe('accessibility', () => {
		it.skip('should pass all aXe tests', async() => {
			const el = await fixture(html`<d2l-content-media-player></d2l-content-media-player>`);
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('d2l-content-media-player');
		});
	});

});
