import './components/two-column-layout.js';
import '@brightspace-ui/core/components/list/list-item-content.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { BASE_PATH } from './state/routing-store.js';

import { DependencyRequester } from './mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from './mixins/internal-localize-mixin.js';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { NavigationMixin } from './mixins/navigation-mixin.js';
import { navigationSharedStyle } from './style/d2l-navigation-shared-styles.js';
import page from 'page/page.mjs';
import { pageNames } from './util/constants.js';
import { ResizeObserver } from 'd2l-resize-aware/resize-observer-module.js';
import { rootStore } from './state/root-store.js';

class D2lCaptureCentralApp extends DependencyRequester(NavigationMixin(InternalLocalizeMixin(MobxReactionUpdate(LitElement)))) {
	static get properties() {
		return {
			canManageAllVideos: { type: Boolean, attribute: 'can-manage-all-videos' },
			_loading: { type: Boolean, attribute: false },
			_permissionError: { type: Boolean, attribute: false },
			_shouldRenderSidebar: { type: Boolean, attribute: false },
		};
	}

	static get styles() {
		return [navigationSharedStyle, css`
			.d2l-capture-central {
				display: flex;
				height: 100%;
				margin: 0 auto;
				max-width: 1230px;
			}

			.d2l-capture-central-loading-spinner {
				display: block;
				margin-top: 20px;
			}

			.d2l-capture-central-primary {
				width: 100%;
			}

			.d2l-capture-central-primary.sidebar {
				width: auto;
			}

			.page {
				display: none;
				min-height: 500px;
			}

			.page[active] {
				display: flex;
				flex-direction:column;
				width: 100%;
			}

			.d2l-capture-central-sidebar-icon {
				margin-right: 10px;
			}

			.d2l-capture-central-sidebar-active {
				font-weight: bolder;
			}

			.d2l-capture-central-sidebar-container {
				margin-top: 25px;
			}

			@media (max-width: 1056px) {
				two-column-layout {
					--sidebar-width: 200px;
				}
			}

			@media (max-width: 768px) {
				two-column-layout {
					--sidebar-width: 65px;
				}
				d2l-list-item-content d2l-link {
					display: none;
				}
			}
		`];
	}

	constructor() {
		super();
		const documentObserver = new ResizeObserver(this._resized.bind(this));
		documentObserver.observe(document.body, { attributes: true });

		this._loading = true;
		this._shouldRenderSidebar = null;
		this._permissionError = false;
		this._setupPageNavigation();
	}

	async connectedCallback() {
		await super.connectedCallback();
		this.userBrightspaceClient = this.requestDependency('user-brightspace-client');

		try {
			const permissions = await this.userBrightspaceClient.getPermissions();

			// "Can Manage All Videos" is mapped from the "Can Manage All Content" permission in Content Service.
			// Since it's not a Capture permission, it is passed down from the LMS to Capture Central as a Lit attribute.
			permissions.canManageAllVideos = this.canManageAllVideos ? 'true' : 'false';
			console.log(permissions.canManageAllVideos);

			rootStore.permissionStore.setPermissions(permissions);
			console.log(rootStore.permissionStore.getCanManageAllVideos());
			this._shouldRenderSidebar = this._shouldRenderSidebar
				&& rootStore.permissionStore.getCanManageCaptureCentral();
		} catch (error) {
			this._permissionError = true;
		}

		this._loading = false;
	}

	render() {
		if (this._loading) {
			return html`
				<d2l-loading-spinner
					class="d2l-capture-central-loading-spinner"
					size="150"
				></d2l-loading-spinner>
			`;
		}
		if (this._permissionError) {
			return html `
				${this.localize('unableToGetPermissions')}
			`;
		}
		const renderContent = () => {
			if (this._shouldRenderSidebar === null) {
				return;
			} else if (this._shouldRenderSidebar) {
				return html`
					<two-column-layout>
						<div slot="sidebar">
							${this._renderSidebar()}
						</div>
						<div slot="primary">
							${this._renderPrimary()}
						</div>
					</two-column-layout>
				`;
			} else {
				return html`${this._renderPrimary()}`;
			}
		};
		return html`
			<div class="d2l-capture-central">
				${renderContent()}
			</div>
		`;
	}

	setupPage(ctx) {
		rootStore.routingStore.setRouteCtx(ctx);
		const { page: currentPage, subView } = rootStore.routingStore;
		this._shouldRenderSidebar =  rootStore.permissionStore.getCanManageCaptureCentral();

		switch (currentPage) {
			case '':
				import('./pages/d2l-capture-central-landing.js');
				return;
			case pageNames.auditLogs:
				import('./pages/reporting/d2l-capture-central-audit-logs.js');
				return;
			case pageNames.clips:
				import('./pages/clips/d2l-capture-central-clips.js');
				return;
			case pageNames.folders:
				import('./pages/folders/d2l-capture-central-folders.js');
				return;
			case pageNames.manageLiveEvents:
				switch (subView) {
					case 'edit':
						import('./pages/live-events/d2l-capture-central-live-events-edit.js');
						return;
					case 'create':
						import('./pages/live-events/d2l-capture-central-live-events-create.js');
						return;
					default:
						import('./pages/live-events/d2l-capture-central-live-events.js');
						return;
				}
			case pageNames.videos:
				import('./pages/videos/d2l-capture-central-videos.js');
				return;
			case pageNames.viewLiveEvent:
				import('./pages/live-events/d2l-capture-central-live-events-view.js');
				return;
			case pageNames.recycleBin:
				import('./pages/recycle-bin/d2l-capture-central-recycle-bin.js');
				return;
			case pageNames.liveEventsReporting:
				import('./pages/reporting/d2l-capture-central-live-events-reporting.js');
				return;
			case pageNames.producer:
				this._shouldRenderSidebar = false;
				if (subView) {
					import('./pages/producer/d2l-capture-central-producer.js');
					return;
				}
				this._navigate('/404');
				return;
			case pageNames.settings:
				import('./pages/settings/d2l-capture-central-settings.js');
				return;
			case pageNames.visits:
				import('./pages/reporting/d2l-capture-central-visits.js');
				return;
			case '404':
				rootStore.routingStore.setPage('404');
				import('./pages/404/d2l-capture-central-404.js');
				return;
			default:
				this._navigate('/404');
				return;
		}
	}

	_renderPrimary() {
		const { page: currentPage, subView } = rootStore.routingStore;
		return html`
			<div class="d2l-capture-central-primary d2l-navigation-gutters ${this._shouldRenderSidebar ? 'sidebar' : ''}">
				<d2l-capture-central-landing class="page" ?active=${currentPage === pageNames.landing}></d2l-capture-central-landing>
				<d2l-capture-central-audit-logs class="page" ?active=${currentPage === pageNames.auditLogs}></d2l-capture-central-audit-logs>
				<d2l-capture-central-clips class="page" ?active=${currentPage === pageNames.clips}></d2l-capture-central-clips>
				<d2l-capture-central-folders class="page" ?active=${currentPage === pageNames.folders}></d2l-capture-central-folders>
				<d2l-capture-central-live-events class="page" ?active=${currentPage === pageNames.manageLiveEvents && !subView}></d2l-capture-central-live-events>
				<d2l-capture-central-live-events-view class="page" ?active=${currentPage === pageNames.viewLiveEvent && subView === 'view'}></d2l-capture-central-live-events-view>
				<d2l-capture-central-live-events-edit class="page" ?active=${currentPage === pageNames.manageLiveEvents && subView === 'edit'}></d2l-capture-central-live-events-edit>
				<d2l-capture-central-live-events-create class="page" ?active=${currentPage === pageNames.manageLiveEvents && subView === 'create'}></d2l-capture-central-live-events-create>
				<d2l-capture-central-live-events-reporting class="page" ?active=${currentPage === pageNames.liveEventsReporting}></d2l-capture-central-live-events-reporting>
				<d2l-capture-central-videos class="page" ?active=${currentPage === pageNames.videos}></d2l-capture-central-videos>
				<d2l-capture-central-recycle-bin class="page" ?active=${currentPage === pageNames.recycleBin}></d2l-capture-central-recycle-bin>
				<d2l-capture-central-producer class="page" ?active=${currentPage === pageNames.producer && !!subView}></d2l-capture-central-producer>
				<d2l-capture-central-settings class="page" ?active=${currentPage === pageNames.settings}></d2l-capture-central-settings>
				<d2l-capture-central-visits class="page" ?active=${currentPage === pageNames.visits}></d2l-capture-central-visits>
				<d2l-capture-central-404 class="page" ?active=${currentPage === pageNames.page404}></d2l-capture-central-404>
			</div>
		`;
	}

	_renderSidebar() {
		const sidebarItems = [ {
			langterm: rootStore.permissionStore.getCanManageAllVideos() ? 'everyonesVideos' : 'myVideos',
			location: `/${pageNames.videos}`,
			icon: rootStore.permissionStore.getCanManageAllVideos() ? 'tier2:browser' : 'tier2:folder',
		}, {
			langterm: 'liveEvents',
			location: `/${pageNames.manageLiveEvents}`,
			icon: 'tier2:file-video',
		}, {
			langterm: 'recycleBin',
			location: `/${pageNames.recycleBin}`,
			icon: 'tier2:delete',
		}];

		const { page: currentPage } = rootStore.routingStore;
		const sidebarListItems = sidebarItems.map(item => {
			const activeItem = currentPage === item.location.split('/')[1];
			return html`
				<d2l-list-item href="javascript:void(0)" @click=${this._goTo(item.location)}>
					<d2l-list-item-content>
						<d2l-icon
							style="${activeItem ? 'color: var(--d2l-color-celestine)' : ''}"
							class="d2l-capture-central-sidebar-icon"
							icon="${item.icon}"
						></d2l-icon><d2l-link
							class="${activeItem ? 'd2l-capture-central-sidebar-active' : ''}"
						>${this.localize(item.langterm)}</d2l-link>
					</d2l-list-item-content>
				</d2l-list-item>
			`;
		});

		return html`
			<div class="d2l-capture-central-sidebar-container d2l-navigation-gutters">
				<d2l-list separators="between">
					${sidebarListItems}
				</d2l-list>
			</div>
		`;
	}

	_resized() {
		rootStore.appTop = this.offsetTop;
	}

	_setupPageNavigation() {
		page.base(BASE_PATH);

		const routes = [
			`/:orgUnitId/${pageNames.page404}`,
			`/:orgUnitId/${pageNames.auditLogs}`,
			`/:orgUnitId/${pageNames.clips}`,
			`/:orgUnitId/${pageNames.folders}`,
			`/:orgUnitId/${pageNames.viewLiveEvent}`,
			`/:orgUnitId/${pageNames.manageLiveEvents}`,
			`/:orgUnitId/${pageNames.manageLiveEvents}/create`,
			`/:orgUnitId/${pageNames.manageLiveEvents}/edit`,
			`/:orgUnitId/${pageNames.videos}`,
			`/:orgUnitId/${pageNames.recycleBin}`,
			`/:orgUnitId/${pageNames.liveEventsReporting}`,
			`/:orgUnitId/${pageNames.producer}/:id`,
			`/:orgUnitId/${pageNames.settings}`,
			`/:orgUnitId/${pageNames.visits}`,
			'/:orgUnitId/',
			'/*',
		];
		routes.forEach(route => page(route, this.setupPage.bind(this)));
		page();
	}
}

customElements.define('d2l-capture-central-app', D2lCaptureCentralApp);
