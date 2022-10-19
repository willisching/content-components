import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '../../util/table-renderer.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { fetchAuth } from 'd2l-fetch-auth';
import { d2lfetch } from 'd2l-fetch/src/index.js';

import {getFriendlyDateFromNow} from '../../util/datetime';

class RecyclingBin extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			serviceUrl: { type: String, attribute: 'service-url' },
			tenantId: { type: String, attribute: 'tenant-id' },
			userId: { type: String, attribute: 'user-id' },

			_isLoading: { type: Boolean, attribute: false },
			_query: { type: String, attribute: false },
			_results: { type: Array, attribute: false },
			_resultStart: { type: Number, attribute: false },
			_resultTotal: { type: Number, attribute: false },
		};
	}

	static get styles() {
		return [
			css`
			.input-container {
				display: flex;
				padding-top: 20px;
				padding-bottom: 20px;
				justify-content: space-between;
			}
			d2l-input-search {
				flex: 0.5;
			}
			total-count {
				flex: 1;
			}
			.load-more {
				margin-top: 20px;
			}
			.filter-results-container {
				text-align: center;
			}
			`
		];
	}

	constructor() {
		super();
		this._isLoading = true;
		this._users = {};

		this._results = null;

		this.d2lfetch = d2lfetch
			.removeTemp('auth')
			.addTemp({ name: 'auth', fn: fetchAuth}, {prepend: true});
		this.tableSortInfo = [
			{header: 'objectName', sortBy: (entry) => entry.lastRevTitle},
			{header: 'owner', sortBy: (entry) => {
				return this._users[entry.ownerId];
			}},
			{header: 'deletedBy', sortBy: (entry) => this._users[entry.deletedByUserId] },
			{header: 'deletedOn', sortBy: (entry) => entry.deletedAt, display: this.deletedOnDisplay.bind(this) },
			{header: 'action', sortBy: () => '', display: this.actionOnDisplay.bind(this) },
		];
	}

	async connectedCallback() {
		super.connectedCallback();
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this.client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });
		await this.search(this.query, false);
	}

	render() {
		const tableEntries = this._results;
		return html`
		<div class="input-container">
			<d2l-input-search
				label=${this.localize('searchEllipsis')}
				@d2l-input-search-searched=${this._handleSearch}
				maxlength="200"
			></d2l-input-search>
			<div id='total-count'>${this.localize('numItems', {count: this._resultTotal})}</div>
		</div>
		${this._isLoading ? '' : html`
		<div class='filter-results-container'>
			<d2l-table-renderer
				.tableSortInfo=${this.tableSortInfo}
				.tableEntries=${tableEntries}
			></d2l-table-renderer>
			${this._results.length < this._resultTotal ?
		html`
				<d2l-button
					class='load-more'
					@click=${this.loadMore}
				>${this.localize('loadMore')}</d2l-button>` : ''
}
		</div>
		`}
		`;
	}

	actionOnDisplay(entry) {
		return html`
			<d2l-button
				@click=${this.restore(entry)}
			>${this.localize('restore')}</d2l-button>`;
	}

	deletedOnDisplay(entry) {
		return html`
		${getFriendlyDateFromNow(entry.deletedAt)}
		<br/>
		<span style='color:#b1b9be;'>${this.localize('permanentlyDeletedIn', {count: 90})}</span>`;
	}

	async getUserName(id) {
		if (this._users[id]) return this._users[id];
		const path = `/d2l/api/lp/1.22/users/${id}`;
		const request = new Request(path);
		const userInfo = await this.d2lfetch.fetch(request);
		const { FirstName: firstName, LastName: lastName } = await userInfo.json();
		const name = `${firstName} ${lastName}`;
		this._users[id] = name;
		return name;
	}

	async loadMore() {
		this.search(this.query, true);
	}

	restore(content) {
		return async() => {
			const oldResults = this._results;
			if (!oldResults.some((result) => result.id === content.id)) {
				return;
			}
			this._results = oldResults.filter((result) => result.id !== content.id);
			try {
				await this.client.content.updateItem({ content: { id: content.id, deletedAt: null } });
				this._resultStart -= 1;
				this._resultTotal -= 1;
			} catch (error) {
				console.error(error);
			}
		};
	}

	async search(query, appendResults = false) {
		this._isLoading = true;
		if (!appendResults) {
			this._resultStart = 0;
		}
		const searchContent = await this.client.search.searchContent({
			query,
			start: this._resultStart,
			sort: 'deletedAt:desc',
			size: 200,
			filter: 'DELETED',
			contentType: 'Scorm,Pdf,Png,Jpg,Gif,M4a,M4v,Mov,Mp3,Mp4,GoogleDrive,Office365,Audio,Video,UnprocessedFile',
			clientApps: 'all',
		});
		this._results = (this._resultStart === 0 ? [] : this._results).concat(searchContent.hits.hits.map((result) => result._source));
		this._resultStart = this._results.length;
		this._resultTotal = searchContent.hits.total;
		const setUserPromise = this._results.map(async({ownerId, deletedByUserId}) => {
			await this.getUserName(ownerId);
			await this.getUserName(deletedByUserId);
		});
		await Promise.all(setUserPromise);
		this._isLoading = false;
	}

	_handleSearch(e) {
		this.query = e.detail.value.trim();
		this.search(this.query, false);
	}
}

customElements.define('d2l-recycling-bin', RecyclingBin);
