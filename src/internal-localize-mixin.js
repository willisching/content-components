import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { LocalizeMixin } from '@brightspace-ui/core/mixins/localize-mixin.js';

/* @polymerMixin */
const internalLocalizeMixin = superClass => class extends LocalizeMixin(superClass) {
	// Must return a promise
	static async getLocalizeResources(langs) {
		for (const lang of langs) {
			let translations;
			switch (lang) {
				/* eslint-disable no-await-in-loop */
				case 'en':
					translations = await import('../../locales/en.js');
					break;
				default:
					continue;
				/* eslint-enable no-await-in-loop */
			}

			if (translations && translations.val) {
				return {
					language: lang,
					resources: translations.val
				};
			}
		}

		return null;
	}
};

export const InternalLocalizeMixin = dedupingMixin(internalLocalizeMixin);
