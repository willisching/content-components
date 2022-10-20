import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '../../../util/table-renderer.js';

class UserSummary extends LitElement {
	static get properties() {
		return {
			contextId: { type: String, attribute: 'context-id' },
			serviceUrl: { type: String, attribute: 'service-url' },
			tenantId: { type: String, attribute: 'tenant-id' },

			_summary: { type: Object, attribute: false },
		};
	}

	static get styles() {
		return [
			css`
			d2l-input-search {
				margin: 10px;
				margin-top: 0px;
			}
			`
		];
	}

	constructor() {
		super();

		this.tableSortInfo = [
			{header: 'name', sortBy: (entry) => `${entry.firstName} ${entry.lastName}`, onclick: ({lmsUserId, firstName, lastName}) => this._goToUserDetails(lmsUserId, firstName, lastName)},
			{header: 'attempts', sortBy: (entry) => entry.attempts},
		];

		this._summary = null;
	}

	async connectedCallback() {
		super.connectedCallback();
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this.client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });
		const summary = await this.client.reports.getUserSummary({contextId: this.contextId});
		this._summary = summary.results;
	}

	render() {
		return html`
		<d2l-input-search
			label='Search User'
			@d2l-input-search-searched=${this._handleSearch}
			maxlength="200"
		></d2l-input-search>
		<d2l-table-renderer
			.tableSortInfo=${this.tableSortInfo}
			.tableEntries=${this._summary}
		></d2l-table-renderer>
		`;
	}

	async getCsv() {
		const response = await this.client.reports.getUserSummary({contextId: this.contextId, csv: true});
		return await response.text();
	}

	_goToUserDetails(userId, firstName, lastName) {

		return () => {
			this.dispatchEvent(new CustomEvent('go-user-detail', {
				detail: {
					userId,
					name: `${firstName} ${lastName}`
				},
			}));
		};
	}

	async _handleSearch(e) {
		this._query = e.detail.value.trim();
		const summary = await this.client.reports.getUserSummary({contextId: this.contextId, searchQuery: this._query});
		this._summary = summary.results;
	}

}

customElements.define('d2l-user-summary', UserSummary);
