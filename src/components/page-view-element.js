
import { css, LitElement } from 'lit-element';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';
import { NavigationMixin } from '../mixins/navigation-mixin.js';

export class PageViewElement extends InternalLocalizeMixin(NavigationMixin(LitElement)) {
	static get properties() {
		return {
			active: { type: Boolean },
		};
	}

	static get styles() {
		return css`
			.loading-overlay {
				align-items: center;
				background-color: white;
				display: flex;
				height: 100%;
				justify-content: center;
				position: absolute;
				width: 100%;
				z-index: 1000;
			}
		`;
	}

	// Only render this page if it's actually visible.
	shouldUpdate() {
		return this.active;
	}
}
