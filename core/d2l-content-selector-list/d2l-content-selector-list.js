import { css, html, LitElement } from 'lit-element/lit-element.js';
import { radioStyles } from '@brightspace-ui/core/components/inputs/input-radio-styles.js';
import { SkeletonMixin } from '@brightspace-ui/core/components/skeleton/skeleton-mixin.js';
import { RequesterMixin } from '@brightspace-ui/core/mixins/provider-mixin.js';
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
import { getFriendlyDate } from '../../util/date.js';
import { ContentCacheDependencyKey } from '../../models/content-cache.js';

class ContentSelectorList extends RequesterMixin(SkeletonMixin(InternalLocalizeMixin(LitElement))) {
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

			_contentItems: { type: Array, attribute: false },
			_hasMore: { type: Boolean, attribute: false },
			_itemToDelete: { type: Object, attribute: false },
			_selectedContent: { type: Object, attribute: false },
			_isLoading: { type: Boolean, attribute: false },
			_scrollerHeight: { type: String, attribute: false },
		};
	}

	static get styles() {
		return [super.styles, radioStyles, css`
			d2l-input-search {
				width: 50%;
			}

			.input-container {
				padding-top: 20px;
			}

			.input-container d2l-button {
				float: right;
			}

			.input-container d2l-button {
				float: right;
			}

			.heading .title-wrapper {
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
				width: 100%;
				flex-direction: column;
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
		`];
	}

	constructor() {
		super();

		this._contentItems = [];
		this._selectedContent = null;
		this._itemToDelete = null;
		this._hasMore = true;
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
					title-text=${this.localize('deleteThis', {toDelete: this._itemToDelete?.lastRevTitle})}
					text=${this.localize('confirmDeleteThis', {toDelete: this._itemToDelete?.lastRevTitle})}
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
		return () => {
			if (item === null) return;
			this.client.content.deleteItem({id: item.id});
			this._contentItems = this._contentItems.filter(contentItem => item.id !== contentItem.id);
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
		this.query = e.detail.value.trim();
		this._contentItems = [];
		this._hasMore = true;
		await this._loadMore();
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
						${this.localize('lastEditedOn', {lastEdited: getFriendlyDate(item?.updatedAt)})}
					</div>
				</div>
				<div class="context-menu">
					<d2l-dropdown-more text=${this.localize('actionDropdown')} class=${this._skeletize(item)}>
						<d2l-dropdown-menu>
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

	async _loadMore() {
		this._isLoading = true;
		const searchLocations = !this.canManageAllObjects && this.searchLocations?.map(l => `ou:${l.id}`).join(',');
		const body = await this.client.search.searchContent({
			query: this.query,
			start: this.start,
			sort: 'updatedAt:desc',
			size: 10,
			contentType: this.contentTypes,
			...searchLocations && { searchLocations },
			...!this.canManageAllObjects && { ownerId: this.userId }
		});

		const contentCache = this.requestInstance(ContentCacheDependencyKey);
		const newItems = body.hits.hits.map((hit) => contentCache?.get(hit._source) ?? hit._source);
		if (newItems.length === 0) {
			this._hasMore = false;
		} else {
			this._hasMore = true;
			this.start += newItems.length;
			this._contentItems = this._contentItems.concat(newItems);
		}

		this._isLoading = false;
		this.dispatchEvent(new CustomEvent('content-loaded'));
	}

	_openDialog(item) {
		return () => {
			this._itemToDelete = item;
			const dialog = this.shadowRoot.querySelector('.d2l-delete-dialog');
			dialog.open();
		};
	}

	_renderContentItems() {
		if (this._contentItems.length === 0) {
			return this._hasMore ?
				this._renderContentItemsSkeleton() :
				html`<p>${this.localize('noResultsFound')}</p>`;
		}

		return this._contentItems.map(this._itemRenderer.bind(this));
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
