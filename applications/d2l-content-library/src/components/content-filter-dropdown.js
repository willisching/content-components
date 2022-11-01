import '@brightspace-ui/core/components/dropdown/dropdown-button-subtle.js';
import '@brightspace-ui/core/components/dropdown/dropdown-content.js';
import '@brightspace-ui/core/components/filter/filter.js';
import '@brightspace-ui/core/components/filter/filter-dimension-set.js';
import '@brightspace-ui/core/components/filter/filter-dimension-set-value.js';
import '../../../../core/d2l-content-library-filter.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import { observe, toJS } from 'mobx';
import { dateFilters } from '../../../../util/date-filter.js';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../../../../mixins/internal-localize-mixin.js';
import { labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { rootStore } from '../state/root-store.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';
import { CLIENT_APPS, CONTENT_TYPES } from '../util/constants.js';

class ContentFilterDropdown extends DependencyRequester(RtlMixin(InternalLocalizeMixin(LitElement))) {
	static get properties() {
		return {
			numSelectedFilters: { type: Number },
			deleted: {type: Boolean}, // Is this filter for the recycle bin?
			_selectedFilterParams: { type: Object, attribute: false }
		};
	}

	static get styles() {
		return [labelStyles, selectStyles, css`
			.filter-option {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-top: 0.3rem;
			}
			.filter-type {
				display: flex;
			}
			.filter-clear {
				display: flex;
				justify-content: space-between;
				margin-top: 0.6rem;
			}
			.filter-clear d2l-button {
				width: 5rem;
			}
			.d2l-input-select {
				width: 7.5rem;
			}
		`];
	}

	constructor() {
		super();

		const { dateModified = '', dateCreated = '', ownership = '', contentTypes = [], clientApps = [] } =
			rootStore.routingStore.getQueryParams();

		this._canManageAllObjects = rootStore.permissionStore.getCanManageAllObjects();
		this._selectedFilterParams = {
			dateModified,
			dateCreated,
			ownership,
			contentTypes: this._normalizeMultiSelectFilterValues(contentTypes),
			clientApps: this._normalizeMultiSelectFilterValues(clientApps)
		};

		// [to be deleted] d2l-filter automatically tracks the number of selected filters, so this is only needed for
		// the old filter
		this.numSelectedFilters = [dateModified, dateCreated].reduce((count, filter) => {
			return filter ? count + 1 : count;
		}, 0);

		this.observeQueryParams();
	}

	connectedCallback() {
		super.connectedCallback();
		this._showAdvancedFilters = this.requestDependency('show-advanced-filters');
	}

	firstUpdated() {
		super.firstUpdated();
		if (this._showAdvancedFilters) {
			this._advancedFilter = this.shadowRoot.querySelector('d2l-content-library-filter');
			this._advancedFilter.selectedFilterParams = this._selectedFilterParams;
		}
	}

	render() {
		if (this._showAdvancedFilters) {
			return html`
				<d2l-content-library-filter
					?can-manage-all-objects=${this._canManageAllObjects}
					?deleted=${this.deleted}
					.contentTypes=${CONTENT_TYPES}
					.clientApps=${CLIENT_APPS}
					@d2l-filter-change=${this._handleD2lFilterChange}
				>
				</d2l-content-library-filter>
			`;
		}

		// [to be deleted] when f19379-media-library-management-filters is removed, the old dropdown filter can be removed along with the related handlers
		return html`
			<d2l-dropdown-button-subtle text="${this.localize('filterCount', { count: this.numSelectedFilters})}" primary>
				<d2l-dropdown-content min-width="150" max-width="400">
					<div class="filter-option">
						<div class="filter-type d2l-label-text" id="date-modified-label">${this.deleted ? this.localize('dateDeleted') : this.localize('dateModified')}</div>
						<select class="d2l-input-select" aria-labelledby="date-modified-label" data-filter='dateModified'>
							<option value="">${this.localize('anyTime')}</option>
							${this.renderFilterOptions(dateFilters, 'dateModified')}
						</select>
					</div>
					<div class="filter-option">
						<div class="filter-type d2l-label-text" id="date-created-label">${this.localize('dateCreated')}</div>
						<select class="d2l-input-select" aria-labelledby="date-created-label" data-filter='dateCreated'>
							<option value="">${this.localize('anyTime')}</option>
							${this.renderFilterOptions(dateFilters, 'dateCreated')}
						</select>
					</div>
					<div class="filter-clear">
						<d2l-button primary @click=${this.updateFilters}>${this.localize('search')}</d2l-button>
						<d2l-button @click=${this.clearFilters}>${this.localize('clear')}</d2l-button>
					</div>
				</d2l-dropdown-content>
			</d2l-dropdown-button-subtle>
		`;
	}

	// [to be deleted] used by old dropdown filter
	clearFilters() {
		this.numSelectedFilters = 0;
		this.filterOptions.forEach(option => {
			option.value = '';
		});
		this.dispatchEvent(new CustomEvent('change-filter-cleared', {
			bubbles: true,
			composed: true
		}));
	}

	// [to be deleted] used by old dropdown filter
	get filterOptions() {
		return this.shadowRoot ? this.shadowRoot.querySelectorAll('select') : [];
	}

	observeQueryParams() {
		observe(
			rootStore.routingStore,
			'queryParams',
			change => {
				if (this.loading) {
					return;
				}

				const { dateModified = '', dateCreated = '', ownership = '', contentTypes = [], clientApps = [] } =
					toJS(change.newValue);
				const normalizedContentTypes = this._normalizeMultiSelectFilterValues(contentTypes);
				const normalizedClientApps = this._normalizeMultiSelectFilterValues(clientApps);

				if (dateModified === this._selectedFilterParams.dateModified &&
					dateCreated === this._selectedFilterParams.dateCreated &&
					ownership === this._selectedFilterParams.ownership &&
					!this._isMultiSelectFilterChanged(this._selectedFilterParams.contentTypes, normalizedContentTypes) &&
					!this._isMultiSelectFilterChanged(this._selectedFilterParams.clientApps, normalizedClientApps)
				) {
					return;
				}

				this._selectedFilterParams = {
					dateModified,
					dateCreated,
					ownership,
					contentTypes: normalizedContentTypes,
					clientApps: normalizedClientApps
				};

				if (this._showAdvancedFilters) {
					this._advancedFilter.selectedFilterParams = this._selectedFilterParams;
				}
			}
		);
	}

	// [to be deleted] used by old dropdown filter
	renderFilterOptions(filterOptions, filterType) {
		return filterOptions.map(filter => html`
			<option
				value="${filter}"
				?selected=${this._selectedFilterParams[filterType] === filter}
			>${this.localize(filter)}</option>
		`);
	}

	get selectedFilterParams() {
		const { dateModified, dateCreated, ownership, contentTypes, clientApps } = this._selectedFilterParams;
		return {
			dateModified,
			dateCreated,
			...(this._canManageAllObjects && { ownership }),
			contentTypes: Array.isArray(contentTypes) ? contentTypes.join(',') : '',
			clientApps: Array.isArray(clientApps) ? clientApps.join(',') : ''
		};
	}

	// [to be deleted] used by old dropdown filter
	updateFilters() {
		let count = 0;
		const detail = {};
		this.filterOptions.forEach(option => {
			detail[option.getAttribute('data-filter')] = option.value;
			count += option.value ? 1 : 0;
		});
		this.numSelectedFilters = count;

		this.dispatchEvent(new CustomEvent('change-filter', {
			bubbles: true,
			composed: true,
			detail
		}));
	}

	_handleD2lFilterChange(event) {
		this._selectedFilterParams = event.target.selectedFilterParams;
	}

	_isMultiSelectFilterChanged(oldFilter, newFilter) {
		const counter = {};
		oldFilter.forEach(option => counter[option] = 1);
		for (const option of newFilter) {
			if (!counter[option]) {
				return true;
			}
			counter[option]++;
		}
		for (const option in counter) {
			if (counter[option] === 1) {
				return true;
			}
		}
		return false;
	}

	_normalizeMultiSelectFilterValues(filterValues) {
		if (typeof filterValues === 'string') {
			return filterValues.length > 0 ? filterValues.split(',') : [];
		}
		return filterValues;
	}
}

window.customElements.define('content-filter-dropdown', ContentFilterDropdown);
