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
import { InternalLocalizeMixin } from '../../../../mixins/internal-localize-mixin.js';
import { NavigationMixin } from '../mixins/navigation-mixin.js';
import { navigationSharedStyle } from '../style/d2l-navigation-shared-styles.js';
import { rootStore } from '../state/root-store.js';
export const filesPage = '/files';
export const recycleBinPage = '/recycle-bin';

export class ContentLibraryList extends DependencyRequester(InternalLocalizeMixin(NavigationMixin(contentSearchMixin(LitElement)))) {
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

			#d2l-content-library-list {
				padding-top: 1px;
			}

			.d2l-content-library-content-list-no-results {
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
			ou = '',
			searchQuery = '',
			sortQuery = 'updatedAt:desc',
			dateCreated = '',
			dateModified = '',
			ownership = '',
			contentTypes = '',
			clientApps = '',
		} = rootStore.routingStore.getQueryParams();

		this.queryParams = { ou, searchQuery, sortQuery, dateCreated, dateModified, ownership, contentTypes, clientApps };
		this._canManageAllObjects = rootStore.permissionStore.getCanManageAllObjects();

		window.addEventListener('scroll', this.onWindowScroll.bind(this));
		this.observeQueryParams();
	}

	connectedCallback() {
		super.connectedCallback();
		this._userId = this.requestDependency('user-id');
	}

	async addNewItemIntoContentItems(item) {
		if (!item || !item.revision || !item.content || !item.upload) {
			return;
		}

		const { title } = item.content;
		const { id: revisionId, type } = item.revision;
		const { id } = item.content;
		const { ownerDisplayName, poster } = item;
		const updatedAt = (new Date()).toISOString();
		const processingStatus = item.processingStatus;

		await this.insertIntoContentItemsBasedOnSort({
			id, revisionId, type, title, ownerDisplayName, updatedAt, poster, processingStatus
		});
	}

	areAnyFiltersActive() {
		return this.queryParams.searchQuery ||
			this.queryParams.dateModified ||
			this.queryParams.dateCreated ||
			this.queryParams.ownership ||
			this.queryParams.contentTypes ||
			this.queryParams.clientApps;
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
		let indexToInsertAt = this._files.findIndex(this.getCompareBasedOnSort(item));
		if (indexToInsertAt === -1) {
			indexToInsertAt = this._files.length;
		}

		if (!this._moreResultsAvailable || indexToInsertAt !== this._files.length) {
			this._files.splice(indexToInsertAt, 0, item);
			this.requestUpdate();
			await this.updateComplete;
		}
	}

	async loadNext({ append = true} = {}) {
		this.loading = true;
		const { sortQuery, searchQuery, dateModified, dateCreated, ownership, contentTypes, clientApps } = this.queryParams;

		const searchFunc = this.page === recycleBinPage ? this._handleDeletedFileSearch : this._handleFileSearch;
		await searchFunc.bind(this)({
			append,
			createdAt: dateCreated,
			query: searchQuery,
			sort: sortQuery,
			updatedAt: dateModified,
			contentTypes,
			clientApps,
			...(this._canManageAllObjects && ownership === 'myMedia' && { ownerId: this._userId })
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
					ownership: updatedOwnership = '',
					contentTypes: updatedContentTypes = '',
					clientApps: updatedClientApps = ''
				} = toJS(change.newValue);

				const { ou, searchQuery, sortQuery, dateCreated, dateModified, ownership, contentTypes, clientApps } =
					this.queryParams;

				if (!(updatedSearchQuery === searchQuery && updatedSortQuery === sortQuery &&
					updatedDateCreated === dateCreated && updatedDateModified === dateModified &&
					updatedOwnership === ownership && updatedContentTypes === contentTypes &&
					updatedClientApps === clientApps
				)) {
					this.queryParams = {
						ou,
						searchQuery: updatedSearchQuery,
						sortQuery: updatedSortQuery,
						dateCreated: updatedDateCreated,
						dateModified: updatedDateModified,
						ownership: updatedOwnership,
						contentTypes: updatedContentTypes,
						clientApps: updatedClientApps,
						filter: this.page === recycleBinPage ? 'DELETED' : undefined,
					};
				}

				this.reloadPage();
			}
		);
	}

	onWindowScroll() {
		const contentListElem = this.shadowRoot.querySelector('#d2l-content-library-list');
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
		this._files = [];
		this._start = 0;
		this._navigate(this.page, this.queryParams);

		try {
			await this.loadNext({ append: false });
		} catch (error) {
			this.loading = false;
			this._files = [];
			this._start = 0;
		}
	}

	renderNotFound() {
		return !this.loading && this._files.length === 0 ? html`
			<div class="d2l-content-library-content-list-no-results">
				${this.localize('noResults')}
			</div>
		` : html``;
	}

}
