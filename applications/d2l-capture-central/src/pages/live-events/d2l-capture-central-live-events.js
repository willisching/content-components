import '../../components/capture-central-live-events.js';
import '../../components/unauthorized-message.js';

import { css, html } from 'lit-element/lit-element.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { PageViewElement } from '../../components/page-view-element.js';
import { rootStore } from '../../state/root-store.js';

class D2LCaptureLiveEvents extends DependencyRequester(PageViewElement) {

	static get properties() {
		return {
			_loading: { type: Boolean, attribute: false },
		};
	}

	static get styles() {
		return [css`
			capture-central-live-events {
				margin-top: 25px;
			}
		`];
	}

	render() {
		if (!rootStore.permissionStore.getCanViewLiveEvents()) {
			return html`
				<unauthorized-message></unauthorized-message>
			`;
		}

		return html`
			<capture-central-live-events></capture-central-live-events>
		`;
	}
}

window.customElements.define('d2l-capture-central-live-events', D2LCaptureLiveEvents);
