import { css, html } from 'lit-element/lit-element.js';
import { heading2Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { PageViewElement } from '../components/page-view-element.js';
import { navigationSharedStyle } from '../styles/d2l-navigation-shared-styles.js';

import '@brightspace-ui/core/components/inputs/input-search.js';
import '../components/content-filter-dropdown.js';
import '../components/content-list/content-list.js';

class ContentPage extends PageViewElement {
	static get styles() {
		return [heading2Styles, navigationSharedStyle, css`
			:host {
				display: block;
			}
			:host([hidden]) {
				display: none;
			}
			.content-page-header {
				align-items: center;
				display: flex;
				justify-content: space-between;
			}
			.content-page-search-input {
				max-width: 12.5rem;
			}
			.content-page-search-filter-section {
				display: flex;
			}
			content-filter-dropdown {
				padding-right: 1rem;
			}
			:host([dir="rtl"]) content-filter-dropdown {
				padding-right: 0;
				padding-left: 1rem;
			}
		`];
	}

	render() {
		return html`
			<div class="content-page-header">
				<h2 class="d2l-heading-2 d2l-navigation-gutters">
					${this.localize('myContent')}
				</h2>
				<div class="content-page-search-filter-section d2l-navigation-gutters">
					<content-filter-dropdown
						@change-filter-cleared=${this._handleFilterCleared}
						@change-filter=${this._handleFilterChange}
					></content-filter-dropdown>
					<d2l-input-search
						class="content-page-search-input"
						label="${this.localize('searchPlaceholder')}"
						placeholder="${this.localize('searchPlaceholder')}"
						maxlength="100"
						value=${this.rootStore.routingStore.getQueryParams().searchQuery || ''}
						@d2l-input-search-searched=${this._handleSearch}
					></d2l-input-search>
				</div>
			</div>
			<content-list></content-list>
		`;
	}

	_handleFilterCleared() {
		const queryParams = this.rootStore.routingStore.getQueryParams();
		delete queryParams.dateCreated;
		delete queryParams.dateModified;
		delete queryParams.contentType;
		this._navigate('/manage/content', queryParams);
	}

	_handleFilterChange({ detail = {} }) {
		this._navigate('/manage/content', {
			...this.rootStore.routingStore.getQueryParams(),
			...detail
		});
	}

	_handleSearch({ detail = {} }) {
		const { value } = detail;

		this._navigate('/manage/content', {
			...this.rootStore.routingStore.getQueryParams(),
			searchQuery: value
		});
	}
}

window.customElements.define('content-page', ContentPage);
