import { html, LitElement } from 'lit-element/lit-element.js';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import '../../../util/table-renderer.js';

class TopicSummary extends LitElement {
	static get properties() {
		return {
			contextId: { type: String, attribute: 'context-id' },
			serviceUrl: { type: String, attribute: 'service-url' },
			tenantId: { type: String, attribute: 'tenant-id' },

			_summary: { type: Object, attribute: false },
		};
	}

	constructor() {
		super();

		this.tableSortInfo = [
			{header: 'title', sortBy: (entry) => entry.title, onclick: ({topicId, title}) => this._goToTopicDetails(topicId, title)},
			{header: 'type', sortBy: (entry) => entry.type},
			{header: 'attempts', sortBy: (entry) => entry.attempts},
			{header: 'completed', sortBy: (entry) => entry.completed},
			{header: 'passed', sortBy: (entry) => entry.passed},
			{header: 'averageScore', sortBy: (entry) => entry.averageScore},
			{header: 'averageTimeSpent', sortBy: (entry) => entry.averageTimeSpent},
		];

		this._summary = null;
	}

	async connectedCallback() {
		super.connectedCallback();
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this.client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });
		const summary = await this.client.reports.getTopicSummary({contextId: this.contextId});
		this._summary = summary.results;
	}

	render() {
		return html`
		<d2l-table-renderer
			.tableSortInfo=${this.tableSortInfo}
			.tableEntries=${this._summary}
		></d2l-table-renderer>
		`;
	}

	async getCsv() {
		const response = await this.client.reports.getTopicSummary({contextId: this.contextId, csv: true});
		return await response.text();
	}

	_goToTopicDetails(topicId, title) {
		return () => {
			this.dispatchEvent(new CustomEvent('go-topic-detail', {
				detail: {
					topicId,
					name: title
				},
			}));
		};
	}

}

customElements.define('d2l-topic-summary', TopicSummary);
