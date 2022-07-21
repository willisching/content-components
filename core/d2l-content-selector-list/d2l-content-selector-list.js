import { css, html, LitElement } from 'lit-element/lit-element.js';
import {radioStyles} from '@brightspace-ui/core/components/inputs/input-radio-styles.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/dialog/dialog-confirm.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import '@brightspace-ui/core/components/dropdown/dropdown-more.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import '@brightspace-ui/core/components/menu/menu.js';
import './src/scroller.js';
import { getFriendlyDate } from '../../util/date.js';

import { ContentServiceApiClient } from '@d2l/content-service-api-client';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';

class ContentSelectorList extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			allowUpload: { type: Boolean },
			allowSelection: { type: Boolean },
			contentTypes: { type: Array },
			serviceUrl: { type: String },
			showDeleteAction: { type: Boolean },
			showRevisionUploadAction: { type: Boolean },
			showEditPropertiesAction: { type: Boolean },
			showPreviewAction: { type: Boolean },
			tenantId: { type: String },

			_contentItems: { type: Array, attribute: false },
			_hasMore: { type: Boolean, attribute: false },
			_itemToDelete: { type: Object, attribute: false },
			selectedContent: { type: Object, attribute: false },
			_isLoading: { type: Boolean, attribute: false },
			_scrollerHeight: { type: String, attribute: false },
		};
	}

	static get styles() {
		return [radioStyles, css`
		d2l-input-search {
			width: 50%;
		}

		.input-container {
			padding-top: 20px;
		}

		.input-container d2l-button {
			float: right;
		}

		.input-button {
			margin-top: 2px;
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
			color: #494c4e;
		}

		.heading .info-wrapper {
			color: #6e7376;
			font-size: 14px;
			margin-top: -2px;
			-webkit-text-size-adjust: 100%;
			height:25px;
		}

		.input-button {
			margin-top: 2px;
		}

		.heading {
			display: flex;
			width: 100%;
			flex-direction: column;
		}

		.search-result {
			display: flex;
			font-size: 14px;
			border-bottom: 1px solid #e3e9f1;
			border-bottom-width: 1px;
			border-bottom-style: solid;
			border-bottom-color: rgb(227, 233, 241);
			padding-top: 6px;
   			padding-bottom: 6px;
		}

		.search-result input[type="radio"] {
			margin-top: 2px;
			height: 23px;
			min-width: 23px;
			margin-right: 15px;
		}

		.context-menu {
			margin-right: 15px;
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
		`];
	}

	constructor() {
		super();

		this._contentItems = [];
		this.selectedContent = null;
		this._itemToDelete = null;
		this._hasMore = true;
		this._isLoading = true;
		this._scrollerHeight = '0px';

		this.contentTypes = [];
		this.showDeleteAction = null;
		this.showRevisionUploadAction = null;
		this.showEditPropertiesAction = null;
		this.showPreviewAction = null;
		this.tenantId = null;
		this.serviceUrl = null;

		this.start = 0;
		this.query = '';
	}

	async connectedCallback() {
		super.connectedCallback();

		const httpClient = new ContentServiceBrowserHttpClient({ serviceUrl: this.serviceUrl });
		this.client = new ContentServiceApiClient({ httpClient, tenantId: this.tenantId });
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
				${this.allowUpload ? html`
				<d2l-button
					id="upload-button"
					@click="${this._handleClickUploadButton}"
				>
					${this.localize('bulkUpload')}
				</d2l-button>` : ''
}
			</div>
			<d2l-scroller
				@load-more=${this._loadMore}
				.hasMore=${this._hasMore}
				?isLoading=${this._isLoading}
			>
				${this._contentItems.length === 0
		? this._hasMore
			? html`<p>${this.localize('loading')}</p>`
			: html`<p>${this.localize('noResultsFound')}</p>`
		: this._contentItems.map(this._itemRenderer.bind(this))}
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
		return this.selectedContent && this.selectedContent.id === result.id;
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

	_handleNewUploadAction() {
		this.dispatchEvent(new CustomEvent('revision-upload-requested'));
	}

	_handleNextButton() {
		this.dispatchEvent(new CustomEvent('on-next-button-click', {
			detail: {
				selectedItem: this.selectedContent
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
			this.selectedContent = item;
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

	_itemRenderer(item) {
		return html`
		<div class="search-result">
			${this.allowSelection ? html`
			<div class="input-button">
				<input
					class="d2l-input-radio"
					name="selected-result"
					type="radio"
					aria-label=${this.localize('itemSelect')}
					?checked=${this._handleChecked(item)}
					@change=${this._handleSelect(item)}
				/>
			</div>` : ''
}
			<div class="heading">
				<div class=title-wrapper>
					<a class="title">
						${item.lastRevTitle}
					</a>
				</div>
				<div class="info-wrapper">
					${this.localize('lastEditedOn', {lastEdited: getFriendlyDate(item.updatedAt)})}
				</div>
			</div>
			<div class="context-menu">
				<d2l-dropdown-more
					text=${this.localize('actionDropdown')}
				>
					<d2l-dropdown-menu>
						<d2l-menu>
							${this.showPreviewAction ? html`<d2l-menu-item class="preview" text=${this.localize('preview')} @click=${this._handleShowPreviewAction(item)}></d2l-menu-item>` : ''}
							${this.showEditPropertiesAction ? html`<d2l-menu-item class="edit-properties" text=${this.localize('editProperties')} @click=${this._handleEditPropertiesAction(item)}></d2l-menu-item>` : ''}
							${this.showRevisionUploadAction ? html`<d2l-menu-item class="revision-upload" text=${this.localize('uploadNewVersion')} @click=${this._handleNewUploadAction}></d2l-menu-item>` : ''}
							${this.showDeleteAction ? html`<d2l-menu-item class="delete-item" text=${this.localize('delete')} @click=${this._openDialog(item)}></d2l-menu-item>` : ''}
						</d2l-menu>
					</d2l-dropdown-menu>
				</d2l-dropdown-more>
			</div>
		</div>
		`;
	}

	async _loadMore() {
		this._isLoading = true;
		const body = await this.client.search.searchContent({
			query: this.query,
			start: this.start,
			sort: 'updatedAt:desc',
			size: 10,
			contentType: this.contentTypes
		});

		const newItems = body.hits.hits.map((hit) => hit._source);
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

}

customElements.define('d2l-content-selector-list', ContentSelectorList);
