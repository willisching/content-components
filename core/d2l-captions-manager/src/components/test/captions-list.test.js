import '../captions-list.js';

import { expect, fixture, html } from '@open-wc/testing';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';

describe('captions-list', () => {

	describe('accessibility', () => {
		it('should pass all axe tests when there are no caption items', async() => {
			const captionsList = [];
			const el = await fixture(html`<captions-list .captionsList=${captionsList}></captions-list>`);
			await expect(el).to.be.accessible();
		});

		it('should pass all axe tests when there are some caption items', async() => {
			const captionsList = [
				{ Filename: 'captionsFile1.srt', LanaguageCode: 'EN', LanaguageName: 'English' },
				{ Filename: 'captionsFile2.srt', LanaguageCode: 'FR', LanaguageName: 'French' }
			];
			const el = await fixture(html`<captions-list .captionsList=${captionsList}></captions-list>`);
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('captions-list');
		});
	});

});
