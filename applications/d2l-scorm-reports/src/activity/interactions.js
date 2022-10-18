import { html, LitElement } from 'lit-element/lit-element.js';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import '../../../../util/table-renderer.js';

class Interactions extends LitElement {
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
			{header: 'identifier', sortBy: (entry) => entry.internalId},
			{header: 'type', sortBy: (entry) => entry.interactionType},
			{header: 'description', sortBy: (entry) => entry.description},
			{header: 'correctResponses', sortBy: (entry) => JSON.stringify(entry.correctResponses)},
			{header: 'learnerResponse', sortBy: (entry) => entry.learnerResponse},
			{header: 'attempt', sortBy: (entry) => entry.attempt},
			{header: 'result', sortBy: (entry) => entry.result},
			{header: 'weighting', sortBy: (entry) => entry.weighting},
			{header: 'latency', sortBy: (entry) => entry.latency},
		];

		this._tableInfo = null;
	}

	async connectedCallback() {
		super.connectedCallback();
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this.client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });
		const tableInfo = await this.client.reports.getInteractions({contextId: this.contextId, topicId: this.topicId, userId: this.userId});
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
		const response = await this.client.reports.getInteractions({contextId: this.contextId, topicId: this.topicId, userId: this.userId, csv: true});
		return await response.text();
	}
}

customElements.define('d2l-activity-interactions', Interactions);
