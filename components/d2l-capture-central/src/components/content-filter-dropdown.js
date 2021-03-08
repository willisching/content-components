import '@brightspace-ui/core/components/dropdown/dropdown-button-subtle.js';
import '@brightspace-ui/core/components/dropdown/dropdown-content.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import { observe, toJS } from 'mobx';
import { dateFilters } from '../util/date-filter.js';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';
import { labelStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { rootStore } from '../state/root-store.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import { selectStyles } from '@brightspace-ui/core/components/inputs/input-select-styles.js';

class ContentFilterDropdown extends DependencyRequester(RtlMixin(InternalLocalizeMixin(LitElement))) {
	static get properties() {
		return {
			numSelectedFilters: { type: Number }
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

		const { dateModified = '', dateCreated = '' } =
			rootStore.routingStore.getQueryParams();
		this.selectedFilterParams = { dateModified, dateCreated };
		this.numSelectedFilters = Object.values(this.selectedFilterParams).reduce((count, filter) => {
			return filter ? count + 1 : count;
		}, 0);

		this.observeQueryParams();
	}

	observeQueryParams() {
		observe(
			rootStore.routingStore,
			'queryParams',
			change => {
				if (this.loading) {
					return;
				}

				const { dateModified = '', dateCreated = '' } =
					toJS(change.newValue);

				if (dateModified === this.selectedFilterParams.dateModified &&
					dateCreated === this.selectedFilterParams.dateCreated
				) {
					return;
				}

				this.selectedFilterParams = { dateModified, dateCreated };
			}
		);
	}

	get filterOptions() {
		return this.shadowRoot.querySelectorAll('select');
	}

	render() {
		return html`
			<d2l-dropdown-button-subtle text="${this.localize('filterCount', { count: this.numSelectedFilters})}" primary>
				<d2l-dropdown-content min-width="150" max-width="400">
					<div class="filter-option">
						<div class="filter-type d2l-label-text" id="date-modified-label">${this.localize('dateModified')}</div>
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

	renderFilterOptions(filterOptions, filterType) {
		return filterOptions.map(filter => html`
			<option
				value="${filter}"
				?selected=${this.selectedFilterParams[filterType] === filter}
			>${this.localize(filter)}</option>
		`);
	}
}

window.customElements.define('content-filter-dropdown', ContentFilterDropdown);
