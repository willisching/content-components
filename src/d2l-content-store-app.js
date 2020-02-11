import { css, html, LitElement } from 'lit-element/lit-element.js';
import page from 'page/page.mjs';

import './components/file-uploader.js';
import { InternalLocalizeMixin } from './mixins/internal-localize-mixin.js';
import { NavigationMixin } from './mixins/navigation-mixin.js';

const BASE_PATH = '/d2l/contentstore';
const stripBasePath = path => path.replace(/^\/(d2l\/contentstore\/)?/, '');

class D2lContentStoreApp extends NavigationMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			_page: { type: String },
			_subView: { type: String },
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

		page('/404', this.setupPage.bind(this));
		page('/my-objects', this.setupPage.bind(this));
		page('/manage/:subview/', this.setupPage.bind(this));
		page('', this.setupPage.bind(this));
		page('*', this.setupPage.bind(this));
		page();
	}

	setupPage(ctx) {
		const pathNameWithoutBase = ctx && ctx.pathname && stripBasePath(ctx.pathname);
		let page = pathNameWithoutBase.includes('/') ?
			pathNameWithoutBase.slice(0, pathNameWithoutBase.indexOf('/')) :
			pathNameWithoutBase;
		const subView = pathNameWithoutBase.includes('/') ?
			pathNameWithoutBase.slice(pathNameWithoutBase.indexOf('/') + 1) :
			'';
		switch (page) {
			/* eslint-disable no-unused-expressions */
			case '':
				this._navigate('/manage/');
				return;
			case 'manage':
				import('./d2l-content-store-manage.js');
				break;
			case 'my-objects':
				import('./my-objects.js');
				break;
			default:
				page = '404';
				import('./d2l-content-store-404.js');
				break;
			/* eslint-enable no-unused-expressions */
		}

		this._subView = subView;
		this._page = page;
	}

	render() {
		return html`
		<main id="main" role="main">
			<my-objects ?active=${this._page === 'my-objects'} class="page"></my-objects>
			<d2l-content-store-manage
				class="page"
				?active=${this._page === 'manage'}
				subView=${this._subView}>
			</d2l-content-store-manage>
			<d2l-content-store-404 class="page" ?active=${this._page === '404'}></d2l-content-store-404>
		</main>
		`;
	}
}

customElements.define('d2l-content-store-app', D2lContentStoreApp);
