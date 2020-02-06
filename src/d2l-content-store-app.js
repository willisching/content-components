import { css, html, LitElement } from 'lit-element/lit-element.js';
import page from 'page/page.mjs';
import { InternalLocalizeMixin } from './mixins/internal-localize-mixin.js';

const BASE_PATH = '/d2l/contentstore/';
const stripBasePath = path => path.replace(/^\/(d2l\/contentstore\/)?/, '');

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
		this._setupPageNavigation();
	}

	_setupPageNavigation() {
		page.base(BASE_PATH);

		page('404', this.setupPage.bind(this));
		page('some-other-page', this.setupPage.bind(this));
		page('my-objects', this.setupPage.bind(this));
		page();
	}

	setupPage(ctx) {
		let page = ctx && ctx.pathname && stripBasePath(ctx.pathname);
		switch (page) {
			/* eslint-disable no-unused-expressions */
			case 'my-objects':
				import('./my-objects.js');
				break;
			case 'some-other-page':
				import('./some-other-page.js');
				break;
			default:
				page = '404';
				import('./d2l-content-store-404.js');
				break;
			/* eslint-enable no-unused-expressions */
		}

		this._page = page;
	}

	render() {
		return html`
			Welcome to the content store.
			<a href="/d2l/contentstore/404">click to go to 404</a>
			<my-objects ?active=${this._page === 'my-objects'} class="page"></my-objects>
			<some-other-page class="page" ?active=${this._page === 'some-other-page'}></some-other-page>
			<d2l-content-store-404 class="page" ?active=${this._page === '404'}></d2l-content-store-404>
		`;
	}
}

customElements.define('d2l-content-store-app', D2lContentStoreApp);
