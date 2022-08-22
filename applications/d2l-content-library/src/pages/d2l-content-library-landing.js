import { heading3Styles, heading4Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { css } from 'lit-element/lit-element.js';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';
import { navigationMixin } from '../mixins/navigation-mixin.js';
import { PageViewElement } from '../components/page-view-element.js';
import { rootStore } from '../state/root-store.js';
import { pageNames } from '../util/constants.js';

class D2lContentLibraryLanding extends DependencyRequester(navigationMixin(PageViewElement)) {

	static get styles() {
		return [heading3Styles, heading4Styles, css`
		`];
	}

	update() {
		super.update();

		if (![pageNames.landing, pageNames.files].includes(rootStore.routingStore.page)) {
			// current page should not be landing page
			return;
		}

		if (rootStore.permissionStore.getCanAccessContentLibrary()) {
			this._navigate('/files');
		} else {
			this._navigate('/404');
		}
	}
}

window.customElements.define('d2l-content-library-landing', D2lContentLibraryLanding);
