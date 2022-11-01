import '@brightspace-ui/core/components/filter/filter.js';
import '@brightspace-ui/core/components/filter/filter-dimension-set.js';
import '@brightspace-ui/core/components/filter/filter-dimension-set-value.js';

import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin';
import { html, LitElement } from 'lit-element/lit-element.js';
import { dateFilters } from '../../util/date-filter.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin';

const FILTER_KEYS = Object.freeze({
	OWNERSHIP: 'ownership',
	CONTENT_TYPES: 'contentTypes',
	CLIENT_APPS: 'clientApps',
	DATE_MODIFIED: 'dateModified',
	DATE_CREATED: 'dateCreated'
});

class ContentLibraryFilter extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			canManageAllObjects: { type: Boolean, attribute: 'can-manage-all-objects' },
			contentTypes: { type: Array },
			clientApps: { type: Array },
			deleted: { type: Boolean }, // Is this filter for deleted items
			_selectedFilterParams: { type: Object, attribute: false }
		};
	}

	constructor() {
		super();
		this._resetFilters();
	}

	get selectedFilterParams() {
		return this._selectedFilterParams;
	}

	set selectedFilterParams(selectedFilters) {
		this._resetFilters();
		Object.keys(selectedFilters).forEach(key => this._selectedFilterParams[key] = selectedFilters[key]);
	}

	render() {
		return html`
			<d2l-filter @d2l-filter-change=${this._handleD2lFilterChange}>
				${this.canManageAllObjects ? html`
					<d2l-filter-dimension-set key="${FILTER_KEYS.OWNERSHIP}" text=${this.localize(FILTER_KEYS.OWNERSHIP)} search-type="none" selection-single>
						${this._renderFilterDimensionSetValues(FILTER_KEYS.OWNERSHIP, ['myMedia', 'everyonesMedia'])}
					</d2l-filter-dimension-set>` : ''}
				<d2l-filter-dimension-set key="${FILTER_KEYS.CONTENT_TYPES}" text="${this.localize('contentType')}" search-type="none" select-all>
					${this._renderFilterDimensionSetValues(FILTER_KEYS.CONTENT_TYPES, this.contentTypes)}
				</d2l-filter-dimension-set>
				<d2l-filter-dimension-set key="${FILTER_KEYS.CLIENT_APPS}" text="${this.localize('clientApp')}" select-all>
					${this._renderFilterDimensionSetValues(FILTER_KEYS.CLIENT_APPS, this.clientApps)}
				</d2l-filter-dimension-set>
				<d2l-filter-dimension-set
					key="${FILTER_KEYS.DATE_MODIFIED}"
					text="${this.deleted ? this.localize('dateDeleted') : this.localize(FILTER_KEYS.DATE_MODIFIED)}"
					search-type="none"
					selection-single
				>${this._renderFilterDimensionSetValues(FILTER_KEYS.DATE_MODIFIED, dateFilters)}
				</d2l-filter-dimension-set>
				<d2l-filter-dimension-set key="${FILTER_KEYS.DATE_CREATED}" text="${this.localize(FILTER_KEYS.DATE_CREATED)}" search-type="none" selection-single>
					${this._renderFilterDimensionSetValues(FILTER_KEYS.DATE_CREATED, dateFilters)}
				</d2l-filter-dimension-set>
			</d2l-filter>
		`;
	}

	_handleD2lFilterChange(event) {
		const { allCleared, dimensions } = event.detail;
		if (allCleared) {
			this._selectedFilterParams = { dateModified: '', dateCreated: '', ownership: '', contentTypes: [], clientApps: [] };
		} else if (dimensions.length > 0) {
			const newFilters = { ...this._selectedFilterParams };
			dimensions.forEach(dimension => {
				const { changes, cleared, dimensionKey } = dimension;
				if ([FILTER_KEYS.DATE_MODIFIED, FILTER_KEYS.DATE_CREATED, FILTER_KEYS.OWNERSHIP].includes(dimensionKey)) {
					if (cleared) {
						newFilters[dimensionKey] = '';
					} else {
						const selected = changes.filter(change => change.selected)[0];
						newFilters[dimensionKey] = selected ? selected.valueKey : '';
					}
				} else {
					const selectionMap = {};
					newFilters[dimensionKey].forEach(option => selectionMap[option] = true);
					changes.forEach(({ valueKey, selected }) => selectionMap[valueKey] = selected);
					newFilters[dimensionKey] = Object.entries(selectionMap).filter(([, value]) => value).map(([key]) => key);
				}
			});
			this._selectedFilterParams = newFilters;
		}
		this.dispatchEvent(new CustomEvent('d2l-filter-change', {
			bubbles: true,
			composed: true,
			detail: {
				selectedFilterParams: this._selectedFilterParams
			}
		}));
	}

	_renderFilterDimensionSetValues(dimension, options) {
		const getLangterm = (option) => {
			switch (dimension) {
				case FILTER_KEYS.CONTENT_TYPES:
					return option.toLowerCase();
				case FILTER_KEYS.CLIENT_APPS:
					return option === 'none' ? 'sourceNone' : `source${option}`;
				default:
					return option;
			}
		};
		return options.map(option => {
			return html`
				<d2l-filter-dimension-set-value
					key="${option}"
					text="${this.localize(getLangterm(option))}"
					?selected=${this._selectedFilterParams[dimension].includes(option)}
				></d2l-filter-dimension-set-value>
			`;
		});
	}

	_resetFilters() {
		this._selectedFilterParams = {
			dateModified: '',
			dateCreated: '',
			ownership: '',
			contentTypes: [],
			clientApps: []
		};
	}

}

customElements.define('d2l-content-library-filter', ContentLibraryFilter);
