
import { css, LitElement } from 'lit-element';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';
import { NavigationMixin } from '../mixins/navigation-mixin.js';
import { rootStore } from '../state/root-store.js';

export class PageViewElement extends InternalLocalizeMixin(NavigationMixin(RtlMixin(MobxReactionUpdate(LitElement)))) {
	static get properties() {
		return {
			active: { type: Boolean }
		};
	}

	static get styles() {
		return css`
		`;
	}

	constructor() {
		super();
		this.rootStore = rootStore;
	}

	// Only render this page if it's actually visible.
	shouldUpdate() {
		return this.active;
	}
}
