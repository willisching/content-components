import { css, html, LitElement } from 'lit-element/lit-element.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { installRouter } from 'pwa-helpers/router.js';
import { InternalLocalizeMixin } from './mixins/internal-localize-mixin.js';
import { navigate } from './actions/app.js';
import { store } from './store.js';

class D2lContentStoreApp extends connect(store)(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			_page: { type: String },
			prop1: { type: String },
			token: {
				type: Object
			},
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
		installRouter(location => this.handleNavigation(location));
		this.loading = true;
	}

	stateChanged(state) {
		this._page = state.app.page;
	}

	render() {
		return html`
			<some-other-page class="page" ?active=${this._page === 'some-other-page'}></some-other-page>
			<d2l-content-store-404 class="page" ?active=${this._page === '404'}></d2l-content-store-404>
		`;
	}

	handleNavigation(location) {
		store.dispatch(navigate(`${location.pathname}${location.search}`));
	}
}

customElements.define('d2l-content-store-app', D2lContentStoreApp);
