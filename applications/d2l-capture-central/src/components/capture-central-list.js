import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list.js';
import './relative-date.js';

import { bodyCompactStyles, bodySmallStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { observe, toJS } from 'mobx';

import { contentSearchMixin } from '../mixins/content-search-mixin.js';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';
import { NavigationMixin } from '../mixins/navigation-mixin.js';
import { navigationSharedStyle } from '../style/d2l-navigation-shared-styles.js';
import { rootStore } from '../state/root-store.js';
export const videosPage = '/videos';
export const recycleBinPage = '/recycle-bin';

export class CaptureCentralList extends DependencyRequester(InternalLocalizeMixin(NavigationMixin(contentSearchMixin(LitElement)))) {
	static get properties() {
		return {
			loading: { type: Boolean, attribute: false },
			page: {type: String, attribute: ''}
		};
	}

	static get styles() {
		return [bodyCompactStyles, bodySmallStyles, navigationSharedStyle, css`
			:host([hidden]) {
				display: none;
			}

			.title {
				word-break: break-word;
			}

			#d2l-content-store-list {
				padding-top: 1px;
			}

			.d2l-capture-central-content-list-no-results {
				display: flex;
				justify-content: center;
				margin-top: 20px;
			}

			d2l-icon {
				border-radius: 5px;
				padding: 12px;
				color: var(--d2l-color-white);
			}
		`];
	}

	constructor() {
		super();
		this.infiniteScrollThreshold = 400;
		this.dateField = 'updatedAt';
		this.loading = false;
		this.alertToastMessage = '';
		this.alertToastButtonText = '';

		const {
			searchQuery = '',
			sortQuery = 'updatedAt:desc',
			dateCreated = '',
			dateModified = '',
		} = rootStore.routingStore.getQueryParams();

		this.queryParams = { searchQuery, sortQuery, dateCreated, dateModified};

		window.addEventListener('scroll', this.onWindowScroll.bind(this));
		this.observeQueryParams();
	}

	async addNewItemIntoContentItems(item) {
		if (!item || !item.revision || !item.content || !item.upload) {
			return;
		}

		const { title } = item.content;
		const { id: revisionId, type } = item.revision;
		const { id } = item.content;
		const { ownerDisplayName } = item;
		const updatedAt = (new Date()).toISOString();

		await this.insertIntoContentItemsBasedOnSort({
			id, revisionId, type, title, ownerDisplayName, updatedAt
		});
	}

	areAnyFiltersActive() {
		return this.queryParams.searchQuery ||
			this.queryParams.dateModified ||
			this.queryParams.dateCreated;
	}

	changeSort({ detail = {} }) {
		const { sortKey, sortQuery } = detail;
		if (/^(createdAt|updatedAt)$/.test(sortKey)) {
			this.dateField = sortKey;
		}

		this._navigate(this.page, {
			...this.queryParams,
			sortQuery
		});
	}

	getCompareBasedOnSort(item) {
		const itemUpdatedAtDate = new Date(item.updatedAt);
		switch (this.queryParams.sortQuery) {
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
					return e.title.toLowerCase() <= item.title.toLowerCase();
				};

			case 'lastRevTitle.keyword:asc':
				return e => {
					return e.title.toLowerCase() >= item.title.toLowerCase();
				};

			default:
				return () => true;
		}
	}

	async insertIntoContentItemsBasedOnSort(item) {
		let indexToInsertAt = this._videos.findIndex(this.getCompareBasedOnSort(item));
		if (indexToInsertAt === -1) {
			indexToInsertAt = this._videos.length;
		}

		if (!this._moreResultsAvailable || indexToInsertAt !== this._videos.length) {
			this._videos.splice(indexToInsertAt, 0, item);
			this.requestUpdate();
			await this.updateComplete;
		}
	}

	async loadNext({ append = true} = {}) {
		this.loading = true;
		const { sortQuery, searchQuery, dateModified, dateCreated } = this.queryParams;

		const searchFunc = this.page === recycleBinPage ? this._handleDeletedVideoSearch : this._handleVideoSearch;
		await searchFunc.bind(this)({
			append,
			createdAt: dateCreated,
			query: searchQuery,
			sort: sortQuery,
			updatedAt: dateModified,
		});

		this.loading = false;
	}

	observeQueryParams() {
		observe(
			rootStore.routingStore,
			'queryParams',
			change => {
				if (this.loading || `/${rootStore.routingStore.page}` !== this.page) {
					return;
				}

				const {
					searchQuery: updatedSearchQuery = '',
					sortQuery: updatedSortQuery = 'updatedAt:desc',
					dateCreated: updatedDateCreated = '',
					dateModified: updatedDateModified = '',
				} = toJS(change.newValue);

				const { searchQuery, sortQuery, dateCreated, dateModified } =
					this.queryParams;

				if (updatedSearchQuery === searchQuery && updatedSortQuery === sortQuery &&
					updatedDateCreated === dateCreated && updatedDateModified === dateModified
				) {
					this.reloadPage();
					return;
				}

				this.queryParams = {
					searchQuery: updatedSearchQuery,
					sortQuery: updatedSortQuery,
					dateCreated: updatedDateCreated,
					dateModified: updatedDateModified,
					filter: this.page === recycleBinPage ? 'DELETED' : undefined,
				};
				this.reloadPage();
			}
		);
	}

	onWindowScroll() {
		const contentListElem = this.shadowRoot.querySelector('#d2l-content-store-list');
		if (contentListElem) {
			const bottom = contentListElem.getBoundingClientRect().top + window.pageYOffset + contentListElem.clientHeight;
			const scrollY = window.pageYOffset + window.innerHeight;
			if (bottom - scrollY < this.infiniteScrollThreshold && this._moreResultsAvailable && !this.loading) {
				this.loadNext();
			}
		}
	}

	async reloadPage() {
		this.loading = true;
		this._videos = [];
		this._start = 0;
		this._navigate(this.page, this.queryParams);

		try {
			await this.loadNext({ append: false });
		} catch (error) {
			this.loading = false;
			this._videos = [];
			this._start = 0;
		}
	}

	renderNotFound() {
		return !this.loading && this._videos.length === 0 ? html`
			<div class="d2l-capture-central-content-list-no-results">
				${this.localize('noResults')}
			</div>
		` : html``;
	}

}
