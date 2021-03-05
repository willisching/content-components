import { css, html, LitElement } from 'lit-element/lit-element.js';
import page from 'page/page.mjs';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { ResizeObserver } from 'd2l-resize-aware/resize-observer-module.js';

import { InternalLocalizeMixin } from './mixins/internal-localize-mixin.js';
import { NavigationMixin } from './mixins/navigation-mixin.js';
import { rootStore } from './state/root-store.js';
import { BASE_PATH } from './state/routing-store.js';

class D2lContentStoreApp extends NavigationMixin(InternalLocalizeMixin(MobxReactionUpdate(LitElement))) {
	static get properties() {
		return {
		};
	}

	static get styles() {
		return [css`
			main {
				display: block;
				height: 100%;
				margin: 0 auto;
				max-width: 1230px;
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
		const documentObserver = new ResizeObserver(this._resized.bind(this));
		documentObserver.observe(document.body, { attributes: true });

		this.loading = true;
		this._setupPageNavigation();
	}

	_resized() {
		rootStore.appTop = this.offsetTop;
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
		rootStore.routingStore.setRouteCtx(ctx);
		const { page } = rootStore.routingStore;

		switch (page) {
			/* eslint-disable no-unused-expressions */
			case '':
				this._navigate('/manage');
				return;
			case 'manage':
				import('./d2l-content-store-manage.js');
				break;
			default:
				rootStore.routingStore.setPage('404');
				import('./d2l-content-store-404.js');
				break;
			/* eslint-enable no-unused-expressions */
		}
	}

	render() {
		return html`
		<main id="main" role="main">
			<d2l-content-store-manage
				class="page"
				?active=${rootStore.routingStore.page === 'manage'}>
			</d2l-content-store-manage>
			<d2l-content-store-404 class="page" ?active=${rootStore.routingStore.page === '404'}></d2l-content-store-404>
		</main>
		`;
	}
}

customElements.define('d2l-content-store-app', D2lContentStoreApp);
