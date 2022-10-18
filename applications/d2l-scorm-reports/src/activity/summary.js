import { html, LitElement } from 'lit-element/lit-element.js';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { formatDateTime } from '@brightspace-ui/intl/lib/dateTime.js';
import '../../../../util/table-renderer.js';

class Summary extends LitElement {
	static get properties() {
		return {
			contextId: { type: String, attribute: 'context-id' },
			serviceUrl: { type: String, attribute: 'service-url' },
			tenantId: { type: String, attribute: 'tenant-id' },
			topicId: { type: String, attribute: 'topic-id' },
			userId: { type: String, attribute: 'user-id' },

			_tableInfo: { type: Array, attribute: false},
		};
	}

	constructor() {
		super();

		this.tableSortInfo = [
			{header: 'lastAccessed', sortBy: (entry) => entry.timestamp, display: (entry) => formatDateTime(new Date(entry.timestamp), {format: 'medium'})},
			{header: 'progress', sortBy: (entry) => (entry.completion === 'completed' ? 'completed' : entry.progress)},
			{header: 'status', sortBy: (entry) => entry.status},
			{header: 'score', sortBy: (entry) => entry.score}
		];

		this._tableInfo = null;
	}

	async connectedCallback() {
		super.connectedCallback();
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this.client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });
		const tableInfo = await this.client.reports.getActivity({contextId: this.contextId, topicId: this.topicId, userId: this.userId});
		this._tableInfo = tableInfo.results;
	}

	render() {
		return html`
		<d2l-table-renderer
			.tableSortInfo=${this.tableSortInfo}
			.tableEntries=${this._tableInfo}
		></d2l-table-renderer>`;
	}

	async getCsv() {
		const response = await this.client.reports.getActivity({contextId: this.contextId, topicId: this.topicId, userId: this.userId, csv: true});
		return await response.text();
	}
}

customElements.define('d2l-activity-summary', Summary);
