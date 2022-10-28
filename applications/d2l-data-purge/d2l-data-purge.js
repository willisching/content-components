import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui/core/components/link/link.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';
import '@brightspace-ui/core/components/dropdown/dropdown-button.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';

function openWindowForDownload(contentType) {
	switch (contentType) {
		case 'Scorm':
		case 'Pdf':
		case 'UnprocessedFile':
			return false;
		default:
			return true;
	}

}

class DataPurge extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			serviceUrl: { type: String, attribute: 'service-url' },
			tenantId: { type: String, attribute: 'tenant-id' },

			_isLoading: { type: Boolean, attribute: false },
			_isLoadingOptions: { type: Boolean, attribute: false },
			_query: { type: String, attribute: false },
			_results: { type: Array, attribute: false },
			_resultStart: { type: Number, attribute: false },
			_revisions: { type: Array, attribute: false },
			_searchResults: { type: Array, attribute: false },
			_selectedContent: { type: Object, attribute: false },
			_selectedRevision: { type: String, attribute: false },
			_selectedRevisionIndex: { type: Number, attribute: false },
			_topics: { type: Object, attribute: false },
		};
	}

	static get styles() {
		return css`
		.filter-container {
			display: flex;
			flex-direction: row;
		}
		.filtered-results-container {
			margin-top: 20px;
		}

		.filtered-results-container .filter-result {
			display: flex;
			flex-direction: row;
			padding-top: 6px;
			padding-bottom: 6px;
			border-bottom: 1px solid #e3e9f1;
			height: 50px;
		}

		.filtered-results-container .filter-result .delete-action {
			margin-left: auto;
		}

		.filtered-results-container .filter-result .title-wrapper {
			display: flex;
			align-items: center;
			min-width: 0;
		}

		.header .package-title {
			min-width: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		h2 {
			font-size: 1.5rem;
			font-weight: 400;
			line-height: 1.8rem;
			margin: 1.5rem 0 1.5rem 0;
		}

		h3 {
			font-size: 1rem;
			font-weight: 700;
			line-height: 1.5rem;
			margin: 1.5rem 0 1.5rem 0;
		}

		h4 {
			font-size: 0.8rem;
			font-weight: 700;
			line-height: 1.2rem;
			margin: 1.5rem 0 1.5rem 0;
		}

		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.topic-list .topic-id {
			margin: 0;
		}
		`;
	}

	constructor() {
		super();
		this.serviceUrl = '';
		this.tenantId = '';
		this._query = '';
		this._results = [];
		this._isLoading = false;
		this._isLoadingOptions = false;
		this._selectedRevisionIndex = 1;
		this._topics = [];
		this._selectedRevision = null;
		this._resultStart = 0;
		this._revisions = null;
		this._searchResults = null;
		this._selectedContent = null;
	}

	connectedCallback() {
		super.connectedCallback();
		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this.client = new ContentServiceApiClient({ tenantId: this.tenantId, httpClient });
	}

	render() {
		if (!this._selectedContent) {
			return this.renderSearchResults();
		}
		return this._renderPurgeOptions();
	}

	renderSearchResults() {
		return html`
		<div class='filter-container'>
			<d2l-input-search
				id='input-search'
				label='Search User'
				@d2l-input-search-searched=${this._handleSearch}
				maxlength='200'
				placeholder=${this.localize('filterPlaceholder')}
			></d2l-input-search>
			<d2l-button id='filter-button' primary @click=${this._handleSearch}>${this.localize('filter')}</d2l-button>
		</div>
		<div class='filtered-results-container'>
			${this._query === ''
		? this.localize('emptyFilter')
		: this._renderResults()}
		</div>
		`;
	}

	_deleteContent(content, index) {
		return async() => {
			this._results[index].deleteInProgress = true;
			this.requestUpdate();
			this.client.content.deleteItem({ id: content.id, hardDelete: true })
				.then(() => {
					this._resultStart -= 1;
					this._results = this._results.filter((item) => item.result.id !== content.id);
				})
				.catch(() => {
					this._results[index].deleteInProgress = false;
					this.requestUpdate();
				});
		};
	}

	_handleBack() {
		this._selectedContent = null;
		this._selectedRevision = null;
		this._topics = [];
	}

	async _handleDownload() {
		const downloadWindow = openWindowForDownload(this._selectedRevision.type)
			? window.open('', '_blank')
			: window;

		const res = await this.client.content.getSignedUrlForRevision({
			id: this._selectedContent.id,
			revisionTag: this._selectedRevision.id
		});
		downloadWindow.location.replace(res.value);
	}

	_handleSearch() {
		if (this._isLoading) return;
		const input = this.shadowRoot.querySelector('#input-search');
		this._query = input.value.trim();
		this._search(this._query, false);
	}

	_handleSelect(result) {
		return async() => {
			this._isLoading = true;
			this._selectedContent = result;
			const content = await this.client.content.getItem({ id: this._selectedContent.id });
			this._revisions = content.revisions;
			this._isLoading = false;
		};
	}

	_renderContexts(contexts) {
		const keys = Object.keys(contexts);
		if (keys.length <= 0) return this.localize('noKnownTopics');
		return keys.map((key) => html`
		<li key=${key}>
			${key}: ${contexts[key].resourceLinkTitle}
		</li>`);
	}

	_renderPurgeOptions() {
		if (this._isLoading) return html`<d2l-loading-spinner size='200'></d2l-loading-spinner>`;
		return html`
		<div class='purge-options'>
			<div class='action-group'>
				<d2l-button
					primary
					class='action-button'
					?disabled=${!this._selectedRevision}
					@click=${this._handleDownload}
				>
					${this.localize('downloadPackage')}
				</d2l-button>
				<d2l-button
					class='action-button back'
					@click=${this._handleBack}
				>
					${this.localize('back')}
				</d2l-button>
			</div>
			<div class='header'>
				<h2 class='package-title'>${this._selectedContent.lastRevTitle}</h2>
				<d2l-dropdown-button text=${this._selectedRevision
		? this.localize('revisionNumber', {number: this._selectedRevisionIndex})
		: this.localize('selectRevision')}
				>
					<d2l-dropdown-menu>
						<d2l-menu>
							${this._renderRevisionList()}
						</d2l-menu>
					</d2l-dropdown-menu>
				</d2l-dropdown-button>
			</div>
			<div class='topic-list'>
				<h3>${this.localize('topicList')}</h3>
				${this._isLoadingOptions
		? html`<d2l-loading-spinner size='200'></d2l-loading-spinner>`
		: this._renderTopicList()}
			</div>
		</div>`;
	}

	_renderResult({result, deleteInProgress}, index) {
		return html`
		<div class='filter-result'>
			<div class='title-wrapper'>
				<d2l-link id='link-${index}' @click=${this._handleSelect(result)}>${result.lastRevTitle}</d2l-link>
			</div>
			${
	deleteInProgress
		? html`<d2l-loading-spinner class='delete-action' size='35'></d2l-loading-spinner>`
		: html`<d2l-button class='delete-action' @click=${this._deleteContent(result, index)}>${this.localize('delete')}</d2l-button>`
}
		</div>`;
	}

	_renderResults() {
		if (this._isLoading) return html`<d2l-loading-spinner size='200'></d2l-loading-spinner>`;
		return html`
		<div class='filtered-results-container'>
		${
	this._results.length > 0
		? this._results.map(this._renderResult.bind(this))
		: this.localize('noResults')
}
		</div>`;
	}

	_renderRevisionList() {
		return this._revisions.map((revision, index) => html`
		<d2l-menu-item
			text=${this.localize('revisionNumber', {number: this._selectedRevisionIndex})}
			@click=${this._selectRevision(index === this._revisions.length - 1 ? 'latest' : revision.id, index)}
		></d2l-menu-item>
		`);
	}

	_renderTopicList() {
		if (this._topics.length <= 0) return html`<div>${this.localize('noTopics')}</div>`;
		return this._topics.map((topic) => html`
		<ul class='topic' key=${topic.id}>
			<li>
				<h4 class='topic-id'>${topic.id}</h4>
				<ul>${this._renderContexts(topic.contexts)}</ul>
			</li>
		</ul>
		`);
	}

	async _search(query, appendResults = false) {
		this._isLoading = true;
		if (!appendResults) {
			this._resultStart = 0;
			this._results = [];
		}
		const searchContent = await this.client.search.searchContent({
			ownerId: query,
			start: this._resultStart,
			size: 10,
			clientApps: 'all',
		});
		const result = searchContent.hits.hits.map((result) => result._source);
		this._results = this._results.concat(result.map(r => {return {result: r, deleteInProgress: false};}));
		this._resultStart += result.length;
		this._isLoading = false;
	}

	_selectRevision(revision, index) {
		return async() => {
			const selectedRevision = revision === 'latest'
				? this._revisions[this._revisions.length - 1]
				: this._revisions.filter((rev) => rev.id === revision)[0];

			this._selectedRevision = selectedRevision;
			this._selectedRevisionIndex = index + 1;
			this._isLoadingOptions = true;
			this._topics = await this.client.content.getAssociatedTopics({
				id: this._selectedContent.id,
				revisionTag: revision
			});
			this._isLoadingOptions = false;
		};
	}

}

customElements.define('d2l-data-purge', DataPurge);
