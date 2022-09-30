import { css, html, LitElement } from 'lit-element/lit-element.js';
import { radioStyles } from '@brightspace-ui/core/components/inputs/input-radio-styles.js';
import { SkeletonMixin } from '@brightspace-ui/core/components/skeleton/skeleton-mixin.js';
import { RequesterMixin } from '@brightspace-ui/core/mixins/provider-mixin.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/dialog/dialog-confirm.js';
import '@brightspace-ui/core/components/dropdown/dropdown-more.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import '@brightspace-ui/core/components/menu/menu.js';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';

import './src/scroller.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { formatDate } from '@brightspace-ui/intl/lib/dateTime.js';
import { ContentCacheDependencyKey } from '../../models/content-cache.js';

class ContentSelectorList extends RtlMixin(RequesterMixin(SkeletonMixin(InternalLocalizeMixin(LitElement)))) {
	static get properties() {
		return {
			allowUpload: { type: Boolean },
			allowSelection: { type: Boolean },
			canManageAllObjects: { type: Boolean },
			canManageSharedObjects: { type: Boolean },
			contentTypes: { type: Array },
			orgUnitId: { type: String },
			searchLocations: { type: Array },
			serviceUrl: { type: String },
			showDeleteAction: { type: Boolean },
			showRevisionUploadAction: { type: Boolean },
			showEditPropertiesAction: { type: Boolean },
			showPreviewAction: { type: Boolean },
			tenantId: { type: String },
			userId: { type: String },

			_contentItems: { type: Object, attribute: false },
			_hasMore: { type: Boolean, attribute: false },
			_stillLoading: { type: Boolean, attribute: false },
			_itemToDelete: { type: Object, attribute: false },
			_selectedContent: { type: Object, attribute: false },
			_isLoading: { type: Boolean, attribute: false },
			_scrollerHeight: { type: String, attribute: false },
			_loadingDelete: { type: Boolean, attribute: false },
		};
	}

	static get styles() {
		return [super.styles, radioStyles, css`
			.input-container {
				display: flex;
				padding-top: 20px;
				justify-content: space-between;
			}

			.heading .title-wrapper {
				align-items: center;
				display: flex;
				flex-direction: row;
				height: 25px;
			}

			.heading .title-wrapper .title {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				cursor: pointer;
				font-size: 19px;
				text-decoration: none;
				color: var(--d2l-color-tungsten);
			}

			.heading .info-wrapper {
				color: var(--d2l-color-galena);
				font-size: 14px;
				margin-top: 5px;
				-webkit-text-size-adjust: 100%;
				line-height: 14px;
			}

			.input-button {
				margin-right: 10px;
				margin-top: 6px;
				height: 26px;
				width: 26px;
			}

			.heading {
				display: flex;
				flex-direction: column;
				min-width: 0;
				width: 100%;
			}

			.search-result {
				display: flex;
				font-size: 14px;
				border-bottom: 1px solid var(--d2l-color-gypsum);
				padding-top: 10px;
				padding-bottom: 10px;
			}

			.search-result input[type="radio"] {
				margin-top: -6px;

			}

			.container {
				display: flex;
				flex-direction: column;
				height: 100%;
				position: relative;
			}

			d2l-scroller {
				flex: 1;
				overflow: auto;
			}

			d2l-icon.dot {
				color: var(--d2l-color-galena);
				width: 10px;
				height: 10px;
			}

			.loading-delete {
				position: absolute;
				top: 0;
				height: 100%;
				left: 0;
				background-color: rgba(255,255,255,0.4);
				width: 100%;
				margin-left: auto;
				margin-right: auto;
			}

			.loading-delete d2l-loading-spinner {
				top: 50%;
				left: 50%;
				position: absolute;
				transform: translate(-50%, -50%);
			}

			.context-menu {
				margin-left: auto;
				margin-right: 15px;
			}

			d2l-menu-item {
				font-size: 0.75rem;
				padding: 0.5rem 0.8rem;
			}

			@media (max-width: 640px) {
				d2l-button {
					padding-left: 1em;
				}
				:host([dir="rtl"]) d2l-button {
					padding-left: 0;
					padding-right: 1em;
				}
			}

			@media (min-width: 641px) {
				d2l-input-search {
					width: 50%;
				}
			}
		`];
	}

	constructor() {
		super();

		this._contentItems = new Map();
		this._selectedContent = null;
		this._itemToDelete = null;
		this._hasMore = true;
		this._stillLoading = true;
		this._isLoading = true;
		this._scrollerHeight = '0px';
		this.skeleton = true;

		this.contentTypes = [];
		this.showDeleteAction = null;
		this.showRevisionUploadAction = null;
		this.showEditPropertiesAction = null;
		this.showPreviewAction = null;
		this.tenantId = null;
		this.searchLocations = [];
		this.serviceUrl = null;

		this.start = 0;
		this.query = '';
		this._loadingDelete = false;
		this._searched = false;
	}

	async connectedCallback() {
		super.connectedCallback();

		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this.client = new ContentServiceApiClient({
			httpClient,
			tenantId: this.tenantId,
			contextId: this.orgUnitId,
			contextType: 'sharingOrgUnit'
		});
	}

	render() {
		return html`
			<div class='container'>
				<div class="input-container">
					<d2l-input-search
						label=${this.localize('searchEllipsis')}
						@d2l-input-search-searched=${this._handleSearch}
						maxlength="200"
					></d2l-input-search>
					${this.allowUpload ? this._renderUploadButton() : ''}
				</div>
				<d2l-scroller
					@load-more=${this._loadMore}
					.hasMore=${this._hasMore}
					?isLoading=${this._isLoading}
				>
					${this._renderContentItems()}
				</d2l-scroller>
				<d2l-dialog-confirm
					class="d2l-delete-dialog"
					title-text=${this.localize('deleteConfirmTitleScorm')}
					text=""
				>
					<d2l-button
						id="delete-button"
						@click="${this._deleteItem(this._itemToDelete)}"
						data-dialog-action="yes"
						primary
						slot="footer"
						aria-label=${this.localize('delete')}
					>
						${this.localize('delete')}
					</d2l-button>
					<d2l-button
						id="cancel-button"
						data-dialog-action="no"
						slot="footer"
						aria-label=${this.localize('cancel')}
					>
						${this.localize('cancel')}
					</d2l-button>
				</d2l-dialog-confirm>
				${this._loadingDelete ? html`
					<div class="loading-delete">
						<d2l-loading-spinner size="150"></d2l-loading-spinner>
					</div>
				` : ''}
			</div>
		`;
	}

	get selectedContent() {
		return this._selectedContent;
	}

	_canDelete(item) {
		return this.canManageAllObjects || item?.ownerId === this.userId;
	}

	_canManage(item) {
		return this._canDelete(item) || this.canManageSharedObjects;
	}

	_deleteItem(item) {
		return async() => {
			if (item === null) return;
			this._loadingDelete = true;
			this._contentItems.delete(item.id);
			// await delete so that item does not show again when loading more items
			await this.client.content.deleteItem({id: item.id});
			this._loadingDelete = false;
			this._stillLoading = false;
			// need to load more after deletion otherwise scroll doesn't continue to work; start with same number of results from before
			await this._loadMore(null, this.start, this._contentItems.size);
		};
	}

	_getScroller() {
		return this.shadowRoot.querySelector('d2l-scroller');
	}

	_handleCancelButton() {
		this.dispatchEvent(new CustomEvent('on-cancel-button-click'));
	}

	_handleChecked(result) {
		if (!result) {
			return;
		}

		return this._selectedContent?.id === result.id;
	}

	_handleClickUploadButton() {
		this.dispatchEvent(new CustomEvent('on-upload-button-click'));
	}

	_handleDeleteAction(item) {
		return () => {
			this._deleteItem(item);
		};
	}

	_handleEditPropertiesAction(item) {
		return () => {
			this.dispatchEvent(new CustomEvent('show-edit-properties', {
				detail: {
					selectedItem: item
				}
			}));
		};
	}

	_handleNextButton() {
		this.dispatchEvent(new CustomEvent('on-next-button-click', {
			detail: {
				selectedItem: this._selectedContent
			}
		}));
	}

	async _handleSearch(e) {
		this.start = 0;
		this._searched = true;
		this.query = e.detail.value.trim();
		this._contentItems = new Map();
		this._hasMore = true;
		this._stillLoading = true;
		// a new search should always start at position 0; double pressing enter quickly may cause it to not start at 0 (and miss search results) if not specified
		await this._loadMore(e, 0);
	}

	_handleSelect(item) {
		const func = () => {
			this._selectedContent = item;
			this.dispatchEvent(new CustomEvent('object-selected'));
		};
		return func.bind(this);
	}

	_handleShowPreviewAction(item) {
		return () => this.dispatchEvent(new CustomEvent('show-preview', {
			detail: {
				id: item.id,
				type: item.lastRevType,
				title: item.lastRevTitle
			}
		}));
	}

	_handleUploadNewRevisionAction(item) {
		return () => this.dispatchEvent(new CustomEvent('revision-upload-requested', {
			detail: {
				id: item.id
			}
		}));
	}

	_itemRenderer(item) {
		return html`
			<div class="search-result ${this._skeletize(item, 'container', false)}">
				${this.allowSelection ? this._renderRadioInput(item) : ''}
				<div class="heading">
					<div class="title-wrapper ${this._skeletize(item, '50')}">
						<a class="title">
							${item?.lastRevTitle}
						</a>
					</div>
					<div class="info-wrapper ${this._skeletize(item, '30')}">
						${item?.ownerId !== this.userId ? html`${this.localize('sharedWithMe')} <d2l-icon class="dot" icon="tier1:dot"></d2l-icon>` : ''}
						${this.localize('lastEditedOn', {lastEdited: formatDate(new Date(item?.updatedAt), {format: 'medium'})})}
					</div>
				</div>
				<div class="context-menu">
					<d2l-dropdown-more text=${this.localize('actionDropdown')} class=${this._skeletize(item)}>
						<d2l-dropdown-menu align="end">
							<d2l-menu>
								${this.showPreviewAction ? html`<d2l-menu-item class="preview" text=${this.localize('preview')} @click=${this._handleShowPreviewAction(item)}></d2l-menu-item>` : ''}
								${this.showEditPropertiesAction && this._canManage(item) ? html`<d2l-menu-item class="edit-properties" text=${this.localize('editProperties')} @click=${this._handleEditPropertiesAction(item)}></d2l-menu-item>` : ''}
								${this.showRevisionUploadAction && this._canManage(item) ? html`<d2l-menu-item class="revision-upload" text=${this.localize('uploadNewVersion')} @click=${this._handleUploadNewRevisionAction(item)}></d2l-menu-item>` : ''}
								${this.showDeleteAction && this._canDelete(item) ? html`<d2l-menu-item class="delete-item" text=${this.localize('delete')} @click=${this._openDialog(item)}></d2l-menu-item>` : ''}
							</d2l-menu>
						</d2l-dropdown-menu>
					</d2l-dropdown-more>
				</div>
			</div>
		`;
	}

	async _loadMore(e = null, start = this.start, size = 10) {
		this._isLoading = true;
		const searchLocations = !this.canManageAllObjects && this.searchLocations?.map(l => `ou:${l.id}`).join(',');
		const body = await this.client.search.searchContent({
			query: this.query,
			start: start,
			sort: 'updatedAt:desc',
			size,
			contentType: this.contentTypes,
			...searchLocations && { searchLocations },
			...!this.canManageAllObjects && { ownerId: this.userId }
		});

		const contentCache = this.requestInstance(ContentCacheDependencyKey);
		const newItems = body.hits.hits.map((hit) => contentCache?.get(hit._source) ?? hit._source);
		if (newItems.length === 0) {
			// searched flag used for displaying "no items found" initially before a search
			if (!this._searched) {
				this._stillLoading = false;
			}
			// need to seperate _hasMore and _stillLoading otherwise _hasMore will be false after search event
			// causing it to briefly show "No results found" during load-more event if another search is made too soon
			if (e && e.type === 'd2l-input-search-searched') {
				this._stillLoading = false;
			} else {
				// _hasMore is set during load-more event which emits when scrolling to end with 10+ items, or when there are less than 10 items found after a search
				this._hasMore = false;
			}
		} else {
			this._stillLoading = true;
			this._hasMore = true;
			this.start = start + newItems.length;
			newItems.forEach((item) => {
				this._contentItems.set(item.id, item);
			});
		}
		this._isLoading = false;
		this.dispatchEvent(new CustomEvent('content-loaded'));
	}

	_openDialog(item) {
		return async() => {
			this._itemToDelete = item;

			// Add overlay while we determine how this object is used
			this._loadingDelete = true;

			// Check to see if and where this object is referenced from Topics
			const content = await this.client.content.getItem({ id: item.id });
			const revisionTopicsArr = await Promise.all(
				content.revisions.map((revision) => this.client.content.getAssociatedTopics(
					{ id: content.id, revisionTag: revision.id }
				))
			);
			const revisionTopics = [].concat(...revisionTopicsArr);

			let dialogDescription = this.localize('deleteConfirmTextNotUsed');
			if (revisionTopics?.length > 0) {
				// Determine how many courses from which this object is referenced
				const courses = [];
				for (const revisionTopic of revisionTopics) {
					if (revisionTopic.contexts) {
						const course = Object.keys(revisionTopic.contexts)[0];
						if (!courses.includes(course)) {
							courses.push(course);
						}
					}
				}
				if (courses.length) {
					dialogDescription = this.localize('deleteConfirmTextUsed', {numCourses: courses.length});
				}
			}

			// Remove overlay and open dialog
			this._loadingDelete = false;
			const dialog = this.shadowRoot.querySelector('.d2l-delete-dialog');
			dialog.text = dialogDescription;
			dialog.open();
		};
	}

	_renderContentItems() {
		if (this._contentItems.size === 0) {
			return this._stillLoading ?
				this._renderContentItemsSkeleton() :
				html`<p>${this.localize('noResultsFound')}</p>`;
		}
		return Array.from(this._contentItems.values()).map(this._itemRenderer.bind(this));
	}

	_renderContentItemsSkeleton() {
		return html`
			${this._itemRenderer(null)}
			${this._itemRenderer(null)}
			${this._itemRenderer(null)}
			${this._itemRenderer(null)}
			${this._itemRenderer(null)}
			${this._itemRenderer(null)}
		`;
	}

	_renderRadioInput(item) {
		return html`
			<div class="input-button ${this._skeletize(item)}">
				<input
					class="d2l-input-radio"
					name="selected-result"
					type="radio"
					aria-label=${this.localize('itemSelect')}
					?checked=${this._handleChecked(item)}
					@change=${this._handleSelect(item)}
				/>
			</div>`;
	}

	_renderUploadButton() {
		return html`
			<d2l-button
				id="upload-button"
				@click="${this._handleClickUploadButton}"
			>
				${this.localize('bulkUpload')}
			</d2l-button>
		`;
	}

	_skeletize(item, variation, includeBase = true) {
		return (item ? '' : `${includeBase ? 'd2l-skeletize' : ''} ${variation ? `d2l-skeletize-${variation}` : ''}`);
	}

}

customElements.define('d2l-content-selector-list', ContentSelectorList);
