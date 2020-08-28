import { css, html, LitElement } from 'lit-element/lit-element.js';
import { BASE_PATH } from './state/routing-store.js';

import { InternalLocalizeMixin } from './mixins/internal-localize-mixin.js';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { NavigationMixin } from './mixins/navigation-mixin.js';
import page from 'page/page.mjs';

import { ResizeObserver } from 'd2l-resize-aware/resize-observer-module.js';
import { rootStore } from './state/root-store.js';

class D2lCaptureCentralApp extends NavigationMixin(InternalLocalizeMixin(MobxReactionUpdate(LitElement))) {
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

		page('/:orgUnitId/404', this.setupPage.bind(this));
		page('/:orgUnitId/admin', this.setupPage.bind(this));
		page('/:orgUnitId/live-events', this.setupPage.bind(this));
		page('/:orgUnitId/live-events/edit', this.setupPage.bind(this));
		page('/:orgUnitId/presentations', this.setupPage.bind(this));
		page('/:orgUnitId/presentations/edit', this.setupPage.bind(this));
		page('/:orgUnitId/video-library', this.setupPage.bind(this));
		page('/:orgUnitId/', this.setupPage.bind(this));
		page('*', this.setupPage.bind(this));
		page();
	}

	setupPage(ctx) {
		rootStore.routingStore.setRouteCtx(ctx);
		const { page, subView } = rootStore.routingStore;

		switch (page) {
			case '':
				this._navigate('/admin');
				return;
			case 'admin':
				import('./pages/admin/d2l-capture-central-admin.js');
				return;
			case 'audit-logs':
				import('./pages/reporting/d2l-capture-central-audit-logs.js');
				return;
			case 'clips':
				import('./pages/clips/d2l-capture-central-clips.js');
				return;
			case 'live-events':
				if (subView === 'edit') {
					import('./pages/live-events/d2l-capture-central-live-events-edit.js');
					return;
				}
				import('./pages/live-events/d2l-capture-central-live-events.js');
				return;
			case 'live-events-reporting':
				import('./pages/reporting/d2l-capture-central-live-events-reporting.js');
				return;
			case 'presentations':
				if (subView === 'edit') {
					import('./pages/presentations/d2l-capture-central-presentations-edit.js');
					return;
				}
				import('./pages/presentations/d2l-capture-central-presentations.js');
				return;
			case 'settings':
				import('./pages/settings/d2l-capture-central-settings.js');
				return;
			case 'video-library':
				import('./pages/video-library/d2l-capture-central-video-library.js');
				return;
			case 'visits':
				import('./pages/reporting/d2l-capture-central-visits.js');
				return;
			default:
				rootStore.routingStore.setPage('404');
				import('./d2l-capture-central-404.js');
				break;
		}
	}

	render() {
		const { page: currentPage, subView } = rootStore.routingStore;
		return html`
		<main id="main" role="main">
			<d2l-capture-central-admin class="page" ?active=${currentPage === 'admin'}></d2l-capture-central-admin>
			<d2l-capture-central-audit-logs class="page" ?active=${currentPage === 'audit-logs'}></d2l-capture-central-audit-logs>
			<d2l-capture-central-clips class="page" ?active=${currentPage === 'clips'}></d2l-capture-central-clips>
			<d2l-capture-central-live-events class="page" ?active=${currentPage === 'live-events' && !subView}></d2l-capture-central-live-events>
			<d2l-capture-central-live-events-edit class="page" ?active=${currentPage === 'live-events' && subView === 'edit'}></d2l-capture-central-live-events-edit>
			<d2l-capture-central-live-events-reporting class="page" ?active=${currentPage === 'live-events-reporting'}></d2l-capture-central-live-events-reporting>
			<d2l-capture-central-presentations class="page" ?active=${currentPage === 'presentations' && !subView}></d2l-capture-central-presentations>
			<d2l-capture-central-presentations-edit class="page" ?active=${currentPage === 'presentations' && subView === 'edit'}></d2l-capture-central-presentations-edit>
			<d2l-capture-central-settings class="page" ?active=${currentPage === 'settings'}></d2l-capture-central-settings>
			<d2l-capture-central-video-library class="page" ?active=${currentPage === 'video-library'}></d2l-capture-central-video-library>
			<d2l-capture-central-visits class="page" ?active=${currentPage === 'visits'}></d2l-capture-central-visits>
			<d2l-capture-central-404 class="page" ?active=${currentPage === '404'}></d2l-capture-central-404>
		</main>
		`;
	}
}

customElements.define('d2l-capture-central-app', D2lCaptureCentralApp);
