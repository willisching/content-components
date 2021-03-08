import '../components/capture-central-live-events.js';

import { heading3Styles, heading4Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { css } from 'lit-element/lit-element.js';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';
import { navigationMixin } from '../mixins/navigation-mixin.js';
import { PageViewElement } from '../components/page-view-element.js';
import { rootStore } from '../state/root-store.js';

class D2lCaptureCentralLanding extends DependencyRequester(navigationMixin(PageViewElement)) {

	static get styles() {
		return [heading3Styles, heading4Styles, css`
		`];
	}

	connectedCallback() {
		super.connectedCallback();
		const permissions = rootStore.permissionStore.getPermissions();
		if (permissions.canManage) {
			this._navigate('/my-videos');
		} else {
			this._navigate('/course-videos');
		}
	}
}

window.customElements.define('d2l-capture-central-landing', D2lCaptureCentralLanding);
