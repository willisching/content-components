import '../captions-upload.js';

import { expect, fixture, html } from '@open-wc/testing';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';

describe('captions-upload', () => {

	describe('accessibility', () => {
		it('should pass all axe tests', async() => {
			const el = await fixture(html`<captions-upload></captions-upload>`);
			await expect(el).to.be.accessible();
		});

		it('should pass all axe tests with uncaptioned languages', async() => {
			const uncaptionedLanguages = [
				{ code: 'ab', name: 'Abkhazian' },
				{ code: 'cs', name: 'Czech' },
				{ code: 'eu', name: 'Basque' }
			];
			const el = await fixture(html`<captions-upload .uncaptionedLanguages=${uncaptionedLanguages}></captions-upload>`);
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('captions-upload');
		});
	});

});
