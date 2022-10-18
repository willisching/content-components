import { css, html, LitElement } from 'lit-element/lit-element.js';
import { tableStyles } from '@brightspace-ui/core/components/table/table-wrapper.js';
import '@brightspace-ui/core/components/table/table-col-sort-button.js';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';

function sortResults(results, sortBy, desc = false) {
	const sorted = [...results].sort((a, b) => {
		const entryA = sortBy(a);
		const entryB = sortBy(b);

		if (entryA < entryB) return -1;
		if (entryA > entryB) return 1;
		return 0;
	});

	if (desc) {
		sorted.reverse();
	}
	return sorted;
}

class ReportsTable extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			initiallySorted: { type: Boolean, attribute: 'sorted'},
			tableSortInfo: { type: Array, attribute: 'table-sort-info' },
			tableEntries: { type: Array, attribute: 'table-entries' },

			_sortDesc: { type: Boolean, attribute: false },
			_currSortInfo: { type: Boolean, attribute: false},
		};
	}

	static get styles() {
		return [
			tableStyles,
			css`
			td > a, td > a:visited, td > a:link, td > a:active {
				color: #006fbf;
				text-decoration: none;
				cursor: pointer;
			}

			td > a:hover, td > a:focus, td > a.d2l-link-focus {
				color: #004489;
				text-decoration: underline;
				outline-width: 0;
			}`
		];
	}

	constructor() {
		super();
		this.tableSortInfo = null;
		this.tableEntries = null;
		this.initiallySorted = true;

		this._sortDesc = false;
		this._currSortInfo = null;
	}

	connectedCallback() {
		super.connectedCallback();
		if (this.initiallySorted) {
			this._currSortInfo = this.tableSortInfo[0];
		}
	}

	render() {
		if (!this.tableEntries) {
			return html`${this.localize('loadingData')}`;
		}
		if (this.tableEntries.length === 0) {
			return html`${this.localize('noDataAvailable')}`;
		}
		let tableRows;
		if (!this._currSortInfo)
			tableRows = this.tableEntries.map(this._renderRow.bind(this));
		else {
			tableRows = sortResults(this.tableEntries, this._currSortInfo.sortBy, this._sortDesc)
				.map(this._renderRow.bind(this));
		}

		return html`
		<d2l-table-wrapper>
			<table class='d2l-table'>
				<thead>
					<tr>
						${this.tableSortInfo.map((sortInfo) => {
		return html`
								<th>
									<d2l-table-col-sort-button
										?nosort=${this._currSortInfo === null || this._currSortInfo.header !== sortInfo.header}
										?desc=${this._sortDesc}
										@click=${this._handleSort(sortInfo)}
									>
										<a>${this.localize(sortInfo.header)}</a>
									</d2l-table-col-sort-button>
								</th>
							`;
	})}
					</tr>
				</thead>
				<tbody>
					${tableRows}
				</tbody>
			</table>
		</d2l-table-wrapper>
		`;
	}

	_handleSort(sortInfo) {
		return () => {
			if (!this._currSortInfo || this._currSortInfo.header !== sortInfo.header) {
				this._sortDesc = true;
			} else {
				this._sortDesc = !this._sortDesc;
			}
			this._currSortInfo = sortInfo;
		};
	}

	_renderRow(entry) {
		return html`
		<tr>
		${this.tableSortInfo.map((entryInfo) => {
		const display = entryInfo.display ? entryInfo.display(entry) : entryInfo.sortBy(entry);
		if (entryInfo.onclick) {
			return html`<td><a @click=${entryInfo.onclick(entry)}>${display ?? this.localize('notApplicable')}</a></td>`;
		}
		return html`<td>${display ?? this.localize('notApplicable')}</td>`;
	})}
		</tr>
		`;
	}

}

customElements.define('d2l-table-renderer', ReportsTable);
