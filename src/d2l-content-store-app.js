import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from './mixins/internal-localize-mixin.js';

class D2lContentStoreApp extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			_page: { type: String },
			prop1: { type: String },
			someStringAttribute: { type: String },
			someBooleanAttribute: { type: Boolean }
		};
	}

	static get styles() {
		return [css`
			main {
				display: block;
				height: 100%;
			}

			.page {
				display: none;
			}

			.page[active] {
				display: block;
			}
		`];
	}

	constructor() {
		super();

		this.prop1 = 'd2l-content-store';
		this.loading = true;
	}

	stateChanged(state) {
		this._page = state.app.page;
	}

	render() {
		return html`
			Welcome to the content store.
			<my-objects ?active=${this._page === 'my-objects'} class="page"></my-objects>
			<some-other-page class="page" ?active=${this._page === 'some-other-page'}></some-other-page>
			<d2l-content-store-404 class="page" ?active=${this._page === '404'}></d2l-content-store-404>
		`;
	}
}

customElements.define('d2l-content-store-app', D2lContentStoreApp);
