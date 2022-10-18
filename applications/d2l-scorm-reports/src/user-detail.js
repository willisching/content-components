import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { formatDate } from '@brightspace-ui/intl/lib/dateTime.js';
import '../../../util/table-renderer.js';

class UserDetail extends LitElement {
	static get properties() {
		return {
			contextId: { type: String, attribute: 'context-id' },
			userId: { type: String, attribute: 'user-id' },
			serviceUrl: { type: String, attribute: 'service-url' },
			tenantId: { type: String, attribute: 'tenant-id' },

			_detail: { type: Object, attribute: false },
			_query: { type: String, attribute: false },
		};
	}

	static get styles() {
		return [
			css`
			d2l-input-search {
				margin: 10px;
				margin-top: 0px;
			}

			.package-name {
				margin: 15px 20px 15px 20px;
			}
			`
		];
	}

	constructor() {
		super();
		this.tableSortInfo = [
			{header: 'title', sortBy: (entry) => entry.title, onclick: ({topicId, title}) => this._goToActivity(topicId, title)},
			{header: 'progress', sortBy: (entry) => (entry.completion === 'completed' ? 'completed' : entry.progress)},
			{header: 'status', sortBy: (entry) => entry.status},
			{header: 'score', sortBy: (entry) => entry.score},
			{header: 'attempts', sortBy: (entry) => entry.attempts},
			{header: 'timeSpent', sortBy: (entry) => entry.timeSpent},
			{header: 'lastAccessed', sortBy: (entry) => entry.lastAccessed, display: (entry) => formatDate(new Date(entry.lastAccessed), {format: 'medium'})},
		];

		this._detail = null;
		this._query = '';
	}

	async connectedCallback() {
		super.connectedCallback();
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this.client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });
		const detail = await this.client.reports.getUserDetail({contextId: this.contextId, userId: this.userId, searchQuery: this._query});
		this._detail = detail.results;
	}

	render() {
		return html`
		<d2l-table-renderer
			.tableSortInfo=${this.tableSortInfo}
			.tableEntries=${this._detail}
		></d2l-table-renderer>`;
	}

	async getCsv() {
		const response = await this.client.reports.getUserDetail({contextId: this.contextId, userId: this.userId, searchQuery: this._query, csv: true});
		return await response.text();
	}

	_goToActivity(topicId, title) {
		return () => {
			this.dispatchEvent(new CustomEvent('go-activity', {
				detail: {
					topicId,
					userId: this.userId,
					name: title
				},
			}));
		};
	}

}

customElements.define('d2l-user-detail', UserDetail);
