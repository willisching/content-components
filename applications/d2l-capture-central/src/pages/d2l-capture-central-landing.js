import '../components/capture-central-live-events.js';

import { heading3Styles, heading4Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { css } from 'lit-element/lit-element.js';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';
import { navigationMixin } from '../mixins/navigation-mixin.js';
import { PageViewElement } from '../components/page-view-element.js';
import { rootStore } from '../state/root-store.js';
import { pageNames } from '../util/constants.js';

class D2lCaptureCentralLanding extends DependencyRequester(navigationMixin(PageViewElement)) {

	static get styles() {
		return [heading3Styles, heading4Styles, css`
		`];
	}

	update() {
		super.update();

		if (![pageNames.landing, pageNames.videos].includes(rootStore.routingStore.page)) {
			// current page should not be landing page
			return;
		}

		if (rootStore.permissionStore.getCanAccessCaptureCentral()) {
			this._navigate('/videos');
		} else {
			this._navigate('/404');
		}
	}
}

window.customElements.define('d2l-capture-central-landing', D2lCaptureCentralLanding);
