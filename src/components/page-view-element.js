
import { css, LitElement } from 'lit-element';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';
import { NavigationMixin } from '../mixins/navigation-mixin.js';

export class PageViewElement extends InternalLocalizeMixin(NavigationMixin(RtlMixin(LitElement))) {
	static get properties() {
		return {
			active: { type: Boolean }
		};
	}

	static get styles() {
		return css`
		`;
	}

	// Only render this page if it's actually visible.
	shouldUpdate() {
		return this.active;
	}
}
