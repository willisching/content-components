import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui/core/components/list/list-item-content.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list.js';
import '../../components/content-filter-dropdown.js';
import '../../components/files/content-list.js';
import '../../components/unauthorized-message.js';

import { css, html } from 'lit-element/lit-element.js';
import { contentSearchMixin } from '../../mixins/content-search-mixin.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { PageViewElement } from '../../components/page-view-element';
import { rootStore } from '../../state/root-store.js';
import { sharedManageStyles } from '../../style/shared-styles.js';

class D2LContentLibraryFiles extends contentSearchMixin(DependencyRequester(PageViewElement)) {
	static get properties() {
		return {
			contentItems: { type: Array, attribute: false },
		};
	}

	static get styles() {
		return [heading2Styles, navigationSharedStyle, sharedManageStyles, css`
			.d2l-content-library-files-heading {
				display: none;
			}
			.d2l-content-library-files-controls {
				display: flex;
				margin: 25px 0;
			}

			content-filter-dropdown {
				margin-left: auto;
			}

			.d2l-content-library-files-input-search {
				margin-left: 10px;
				max-width: 375px;
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

			@media (max-width: 768px) {
				.d2l-content-library-files-heading {
					display: flex;
					width: 100%;
				}
				.d2l-content-library-files-controls {
					margin-top: 0;
				}
			}
		`];
	}

	connectedCallback() {
		super.connectedCallback();
		this._showAdvancedFilters = this.requestDependency('show-advanced-filters');
	}

	render() {
		const heading = rootStore.permissionStore.getCanManageAllObjects() ? this.localize('everyonesMedia') : this.localize('myMedia');
		return html`
			<div class="d2l-content-library-manage-container">
				<h2 class="d2l-content-library-files-heading d2l-heading-2">${heading}</h2>
				<div class="d2l-content-library-files-controls">
					<content-filter-dropdown
						@change-filter-cleared=${this._handleFilterCleared}
						@change-filter=${this._handleFilterChange}
					></content-filter-dropdown>
					<d2l-input-search
						class="d2l-content-library-files-input-search"
						label="${this.localize('searchPlaceholder')}"
						placeholder="${this.localize('searchPlaceholder')}"
						maxlength="100"
						value=${this.rootStore.routingStore.getQueryParams().searchQuery || ''}
						@d2l-input-search-searched=${this._handleSearch}
					></d2l-input-search>
				</div>
				<content-list></content-list>
			</div>
		`;
	}

	_handleFilterChange({ detail = {} }) {
		this._navigate('/files', {
			...this.rootStore.routingStore.getQueryParams(),
			...detail
		});
	}

	_handleFilterCleared() {
		const queryParams = this.rootStore.routingStore.getQueryParams();
		delete queryParams.dateCreated;
		delete queryParams.dateModified;
		this._navigate('/files', queryParams);
	}

	_handleSearch(event) {
		const { value } = event.detail;
		const queryParams = this._showAdvancedFilters ?
			this.shadowRoot.querySelector('content-filter-dropdown').selectedFilterParams :
			this.rootStore.routingStore.getQueryParams();

		this._navigate('/files', {
			...queryParams,
			searchQuery: value
		});
	}
}
customElements.define('d2l-content-library-files', D2LContentLibraryFiles);
