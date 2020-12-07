import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '../../components/content-filter-dropdown.js';
import '../../components/my-videos/content-list.js';
import '../../components/two-column-layout.js';
import '../../components/upload-status-management.js';

import { css, html } from 'lit-element/lit-element.js';
import { contentSearchMixin } from '../../mixins/content-search-mixin';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { PageViewElement } from '../../components/page-view-element';
import { sharedManageStyles } from '../../style/shared-styles.js';

class D2LCaptureCentralMyVideos extends contentSearchMixin(DependencyRequester(PageViewElement)) {
	static get properties() {
		return {
			contentItems: { type: Array, attribute: false },
			loading: { type: Boolean, attribute: false },
		};
	}

	static get styles() {
		return [sharedManageStyles, navigationSharedStyle, css`
			.d2l-capture-central-manage-container {
				width: unset;
				margin: 25px 0;
			}
			.d2l-capture-central-my-videos-header {
				align-items: center;
				display: flex;
				justify-content: space-between;
			}
			.d2l-capture-central-my-videos-filter-section {
				display: flex;
				margin-left: auto;
			}
			.d2l-capture-central-my-videos-input-search {
				margin-left: 10px;
			}

			.sidebar-container {
				display: flex;
				flex-direction: column;
				padding-top: 1.5rem;
				padding-bottom: 1.5rem;
			}
			.list-container {
				margin-top: 0.75rem;
			}
			.list-item-container {
				align-items: center;
				display: flex;
				flex-wrap: nowrap;
			}
			.list-item-label {
				color: var(--d2l-color-ferrite) !important;
				padding-left: 0.75rem;
			}
			:host([dir="rtl"]) .list-item-label {
				padding-left: 0;
				padding-right: 0.75rem;
			}
		`];
	}

	constructor() {
		super();
		this.apiClient = this.requestDependency('content-service-client');
		this.uploader = this.requestDependency('uploader');
	}

	_handleFileUploadClick() {
		this.shadowRoot.querySelector('#fileInput').click();
	}

	_handleFileChange(event) {
		this.uploader.uploadFiles(event.target.files);
		event.target.value = '';
	}

	_handleFilterCleared() {
		const queryParams = this.rootStore.routingStore.getQueryParams();
		delete queryParams.dateCreated;
		delete queryParams.dateModified;
		this._navigate('/my-videos', queryParams);
	}

	_handleFilterChange({ detail = {} }) {
		this._navigate('/my-videos', {
			...this.rootStore.routingStore.getQueryParams(),
			...detail
		});
	}

	_handleSearch(event) {
		const { value } = event.detail;

		this._navigate('/my-videos', {
			...this.rootStore.routingStore.getQueryParams(),
			searchQuery: value
		});
	}

	render() {
		return html`
			<two-column-layout>
				<div slot="sidebar">
					${this.renderSidebar()}
				</div>
				<div slot="primary">
					${this.renderPrimary()}
				</div>
			</two-column-layout>
			<upload-status-management id="upload-status-management"></upload-status-management>
		`;
	}

	renderPrimary() {
		return html`
			<div class="d2l-capture-central-manage-container d2l-navigation-gutters">
				<d2l-breadcrumbs>
					<d2l-breadcrumb
						@click=${this._goTo('/admin')}
						href="#"
						text="${this.localize('captureCentral')}"
					></d2l-breadcrumb>
					<d2l-breadcrumb-current-page
						text="${this.localize('captureVideos')}"
					></d2l-breadcrumb-current-page>
				</d2l-breadcrumbs>
				<div class="d2l-capture-central-my-videos-header">
					<h2 class="d2l-heading-2">
						${this.localize('myCaptureVideos')}
					</h2>
					<div class="d2l-capture-central-my-videos-filter-section">
						<content-filter-dropdown
							@change-filter-cleared=${this._handleFilterCleared}
							@change-filter=${this._handleFilterChange}
						></content-filter-dropdown>
						<d2l-input-search
							class="d2l-capture-central-my-videos-input-search"
							label="${this.localize('searchPlaceholder')}"
							placeholder="${this.localize('searchPlaceholder')}"
							maxlength="100"
							value=${this.rootStore.routingStore.getQueryParams().searchQuery || ''}
							@d2l-input-search-searched=${this._handleSearch}
						></d2l-input-search>
					</div>
				</div>
				<content-list></content-list>
			</div>
		`;
	}

	renderSidebar() {
		return html`
			<div class="sidebar-container d2l-navigation-gutters">
				<d2l-button @click=${this._handleFileUploadClick} primary>${this.localize('upload')}</d2l-button>
				<div class="list-container">
					<d2l-list separators="between">
						<d2l-list-item href="javascript:void(0)">
							<d2l-list-item-content class="list-item-container">
								<d2l-icon icon="tier2:content"></d2l-icon><span class="list-item-label">${this.localize('myCaptureVideos')}</span>
							</d2l-list-item-content>
						</d2l-list-item>
					</d2l-list>
				</div>
			</div>
			<input type="file" id="fileInput" @change=${this._handleFileChange} style="display:none" multiple />
		`;
	}

}
customElements.define('d2l-capture-central-my-videos', D2LCaptureCentralMyVideos);
