import { css, html, LitElement } from 'lit-element/lit-element.js';
import {
	bodyCompactStyles,
	bodySmallStyles,
	labelStyles
} from '@brightspace-ui/core/components/typography/styles.js';
import { observe, toJS } from 'mobx';

// Polyfills
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/icons/icon.js';
import './content-list-item.js';
import './content-list-item-ghost.js';
import './content-list-header.js';
import '../content-icon.js';
import '../relative-date.js';
import '../content-file-drop.js';

import { navigationSharedStyle } from '../../styles/d2l-navigation-shared-styles.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { NavigationMixin } from '../../mixins/navigation-mixin.js';
import { typeLocalizationKey } from '../../util/content-type.js';
import { rootStore } from '../../state/root-store.js';

class ContentList extends DependencyRequester(InternalLocalizeMixin(NavigationMixin(LitElement))) {
	static get properties() {
		return {
			contentItems: { type: Array, attribute: false },
			loading: { type: Boolean, attribute: false }
		};
	}

	static get styles() {
		return [bodyCompactStyles, bodySmallStyles, labelStyles, navigationSharedStyle, css`
			:host([hidden]) {
				display: none;
			}

			.title {
				word-break: break-word;
			}

			#d2l-content-store-list {
				padding-top: 1px;
			}
		`];
	}

	constructor() {
		super();
		this.contentItems = [];
		this.infiniteScrollThreshold = 400;
		this.resultSize = 20;
		this.dateField = 'updatedAt';
		this.totalResults = 0;
		this.loading = false;
		this.hasNextPage = false;
		this.searchQueryStart = 0;

		const { q = '', sortQuery = 'updatedAt:desc' } = rootStore.routingStore.getQueryParams();
		this.sortQuery = sortQuery;
		this.searchQuery = q;

		this.addEventListener('content-list-item-renamed', this.contentListItemRenamedHandler);
		window.addEventListener('scroll', this.onWindowScroll.bind(this));
		this.observeQueryParams();
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
		this.uploader = this.requestDependency('uploader') || rootStore.uploader;
		this.observeSuccessfulUpload();
		this.reloadPage();
	}

	onWindowScroll() {
		const contentListElem = this.shadowRoot.querySelector('#d2l-content-store-list');
		const bottom = contentListElem.getBoundingClientRect().top + window.pageYOffset + contentListElem.clientHeight;
		const scrollY = window.pageYOffset + window.innerHeight;
		if (bottom - scrollY < this.infiniteScrollThreshold && this.hasNextPage && !this.loading) {
			this.loadNext(true);
		}
	}

	observeQueryParams() {
		observe(
			rootStore.routingStore,
			'queryParams',
			change => {
				if (this.loading) {
					return;
				}

				const { q = '', sortQuery = 'updatedAt:desc' } = toJS(change.newValue);
				if (q === this.searchQuery && sortQuery === this.sortQuery) {
					return;
				}

				this.searchQuery = q;
				this.sortQuery = sortQuery;
				this.reloadPage();
			}
		);
	}

	observeSuccessfulUpload() {
		observe(
			this.uploader,
			'successfulUpload',
			async change => {
				if (change.newValue && change.newValue.content && !this.searchQuery) {
					return this.addNewItemIntoContentItems(toJS(change.newValue));
				}
			}
		);
	}

	changeSort({ detail = {} }) {
		if (/^(createdAt|updatedAt)$/.test(detail.sortKey)) {
			this.dateField = detail.sortKey;
		}

		this._navigate('/manage/content', {
			q: encodeURIComponent(this.searchQuery),
			sortQuery: detail.sortQuery
		});

		this.sortQuery = detail.sortQuery;
	}

	async reloadPage() {
		this.loading = true;
		this.contentItems = [];
		this.searchQueryStart = 0;
		this._navigate('/manage/content', {
			q: encodeURIComponent(this.searchQuery),
			sortQuery: this.sortQuery
		});

		try {
			await this.loadNext();
		} catch (error) {
			this.loading = false;
			this.contentItems = [];
			this.searchQueryStart = 0;
		}
	}

	async loadNext() {
		this.loading = true;
		const searchResult = await this.apiClient.searchContent({
			start: this.searchQueryStart,
			size: this.resultSize,
			sort: this.sortQuery,
			query: this.searchQuery
		});
		this.totalResults = searchResult.hits.total;
		this.searchQueryStart += searchResult.hits.hits.length;
		this.hasNextPage = this.searchQueryStart < this.totalResults;
		this.contentItems.push(...searchResult.hits.hits.map(item => item._source));
		this.loading = false;
	}

	render() {
		return html`
			<content-list-header @change-sort=${this.changeSort}></content-list-header>
			<content-file-drop>
				<div id="d2l-content-store-list" class="d2l-navigation-gutters">
					${this.renderNotFound()}
					${this.contentItems.map(item => this.renderContentItem(item))}
					${this.renderGhosts()}
				</div>
			</content-file-drop>
		`;
	}

	renderContentItem(item) {
		const { lastRevType: type } = item;
		const lkey = typeLocalizationKey(type);
		const iconType = lkey ? this.localize(lkey) : type;
		return html`
		<content-list-item
			id=${item.id}
			revision-id=${item.lastRevId}
			selectable
			type=${type}
			title=${item.lastRevTitle}
		>
			<content-icon type="${iconType}" slot="icon"></content-icon>
			<div slot="title" class="title">${item.lastRevTitle}</div>
			<div slot="type">${type}</div>
			<relative-date slot="date" value=${item[this.dateField]}></relative-date>
		</content-list-item>
		`;
	}

	renderGhosts() {
		return new Array(5).fill().map(() => html`
			<d2l-list><content-list-item-ghost ?hidden=${!this.loading}></content-list-item-ghost></d2l-list>
		`);
	}

	renderNotFound() {
		return !this.loading && this.contentItems.length === 0 ? html`
			<d2l-list>
				<d2l-list-item class="d2l-body-compact">
					${this.localize('noResultsFound')}
				</d2l-list-item>
			</d2l-list>
		` : html``;
	}

	contentListItemRenamedHandler(e) {
		const { detail } = e;

		if (!detail) {
			return;
		}

		const { id, title } = detail;

		if (id && title) {
			const index = this.contentItems.findIndex(c => c.id === id);
			if (index >= 0 && index < this.contentItems.length) {
				this.contentItems[index].lastRevTitle = title;
				this.contentItems[index][this.dateField] = (new Date()).toISOString();
				this.requestUpdate();
			}
		}
	}

	async addNewItemIntoContentItems(item) {
		if (!item || !item.revision || !item.content || !item.upload) {
			return;
		}

		const { id: lastRevId, title: lastRevTitle, type: lastRevType } = item.revision;
		const { id } = item.content;
		const updatedAt = (new Date()).toISOString();

		await this.insertIntoContentItemsBasedOnSort({
			id, lastRevType, lastRevTitle, lastRevId, updatedAt
		});
	}

	async insertIntoContentItemsBasedOnSort(item) {
		let indexToInsertAt = this.contentItems.findIndex(this.getCompareBasedOnSort(item));
		if (indexToInsertAt === -1) {
			indexToInsertAt = this.contentItems.length;
		}

		if (!this.hasNextPage || indexToInsertAt !== this.contentItems.length) {
			this.contentItems.splice(indexToInsertAt, 0, item);
			this.requestUpdate();
			await this.updateComplete;
		}
	}

	getCompareBasedOnSort(item) {
		const itemUpdatedAtDate = new Date(item.updatedAt);
		switch (this.sortQuery) {
			case 'updatedAt:desc':
				return e => {
					const elementUpdatedAtDate = new Date(e.updatedAt);
					return elementUpdatedAtDate <= itemUpdatedAtDate;
				};

			case 'updatedAt:asc':
				return e => {
					const elementUpdatedAtDate = new Date(e.updatedAt);
					return elementUpdatedAtDate >= itemUpdatedAtDate;
				};

			case 'lastRevTitle.keyword:desc':
				return e => {
					return e.lastRevTitle.toLowerCase() <= item.lastRevTitle.toLowerCase();
				};

			case 'lastRevTitle.keyword:asc':
				return e => {
					return e.lastRevTitle.toLowerCase() >= item.lastRevTitle.toLowerCase();
				};

			default:
				return () => true;
		}
	}
}

window.customElements.define('content-list', ContentList);
