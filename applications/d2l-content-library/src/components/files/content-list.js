import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list.js';
import '../content-file-drop.js';
import '../relative-date.js';
import './content-list-header.js';
import './content-list-item-ghost.js';
import './content-list-item.js';
import { ContentLibraryList, filesPage } from '../content-library-list.js';

import { html } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { observe, toJS } from 'mobx';

import { rootStore } from '../../state/root-store.js';

class ContentList extends ContentLibraryList {
	static get properties() {
		return {
			allSelected: { type: Boolean, attribute: false},
			selectedItems: { type: Object, attribute: false },
			inProgress: { type: Boolean, attribute: false },
			showBulkActions: { type: Boolean, attribute: 'show-bulk-actions' }
		};
	}

	constructor() {
		super();
		this.page = filesPage;
		this.addEventListener('select-all-change', this._onSelectAllChange);
		this.addEventListener('d2l-list-item-selected', this._onSelectChange);
		this.addEventListener('content-list-items-deleted', this.openDeleteDialog);
		this.addEventListener('content-list-items-owner-changed', this.openTransferOwnershipDialog);
		this.selectedItems = new Set();
		this.allSelected = false;
		this.undoDeleteObjects = new Set();
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
		this.uploader = this.requestDependency('uploader') || rootStore.uploader;
		this.canTransferOwnership = rootStore.permissionStore.getCanTransferOwnership();
		if (this.canTransferOwnership) {
			// needed to retrieve display names for owners in contentSearchMixin
			this.userBrightspaceClient = this.requestDependency('user-brightspace-client');
		}
		this.observeSuccessfulUpload();
		this.reloadPage();
	}

	firstUpdated() {
		super.firstUpdated();
		this.addEventListener('processing-done', this.updateVideoProcessingStatus);
	}

	render() {
		return html`
			<content-list-header
				@change-sort=${this.changeSort}
				?can-transfer-ownership=${this.canTransferOwnership}
				?any-selected=${this.selectedItems.size > 0}
				?all-selected=${this.allSelected}
				?disable-select-all=${!(this._files?.length > 0) || this.inProgress}
				?show-bulk-actions=${this.showBulkActions}
			></content-list-header>
			<content-file-drop @file-drop-error=${this.fileDropErrorHandler}>
			<d2l-list>
				<div id="d2l-content-library-list">
					${this.renderNotFound()}
					${this._files.map(item => this.renderContentItem(item))}
					${this.renderGhosts()}
				</div>
			</d2l-list>
			</content-file-drop>

			<d2l-alert-toast
				id="delete-toast"
				type="default"
				button-text=${this.alertToastButtonText}
				@d2l-alert-toast-button-press=${this.undoDeleteHandler}>
				${this.alertToastMessage}
			</d2l-alert-toast>

			<d2l-alert-toast
				id="file-drop-toast"
				type="error">
				${this.fileDropErrorMessage}
			</d2l-alert-toast>

			<d2l-dialog-confirm
				id="bulk-delete-dialog"
				title-text="${this.localize('confirmDelete')}"
				text="${this.localize('confirmBulkDeleteMessage', {count: this.selectedItems.size})}"
				>
				<d2l-button @click="${this.bulkDeleteHandler}" data-dialog-action="yes" primary slot="footer">${this.localize('delete')}</d2l-button>
				<d2l-button data-dialog-action="no" slot="footer">${this.localize('cancel')}</d2l-button>
			</d2l-dialog-confirm>

			${this.canTransferOwnership ? html`
				<d2l-transfer-ownership-dialog
					id="bulk-transfer-ownership"
					owner-id=${this.ownerId}
					bulk-count=${this.selectedItems.size}
					@transfer-ownership-dialog-transfer=${this.bulkTransferOwnershipHandler}
				></d2l-transfer-ownership-dialog>` : ''}
		`;
	}

	async bulkDeleteHandler() {
		this.inProgress = true;
		this.undoDeleteObjects.clear();
		for (const item of this.selectedItems) {
			const index = this._files.findIndex(c => c.id === item.id);
			this._files[index].processingStatus = 'deleting';
		}
		this.requestUpdate();
		for (const item of this.selectedItems) {
			try {
				await this.apiClient.content.deleteItem({
					id: item.id
				});
			} catch (error) {
				console.warn(`Error while deleting item ${item.id}`, error);
				this.selectedItems.delete(item);
			}
		}
		this.removeItemsFromContentList(this.selectedItems);

		this.updateAfterDeleted(this.selectedItems.size);

		this.allSelected = false;
		this.selectedItems.clear();
		this.inProgress = false;
		this.requestUpdate();
	}

	async bulkTransferOwnershipHandler(event) {
		this.inProgress = true;
		for (const item of this.selectedItems) {
			const index = this._files.findIndex(c => c.id === item.id);
			this._files[index].processingStatus = 'transferring';
		}
		this.requestUpdate();
		for (const item of this.selectedItems) {
			event.detail.id = item.id;
			try {
				await item.transferOwnershipHandler(event);
			} catch (error) {
				console.warn(`Error while transferring ownership of item ${item.id}`, error);
			}
			const index = this._files.findIndex(c => c.id === item.id);
			this._files[index].processingStatus = 'ready';
			this.requestUpdate();
		}
		this.inProgress = false;
	}

	contentListItemDeletedHandler(e) {
		e.detail.bulk ? {} : this.undoDeleteObjects.clear();
		if (e && e.detail && e.detail.id) {
			const { id } = e.detail;
			const index = this._files.findIndex(c => c.id === id);

			if (index >= 0 && index < this._files.length) {
				this.removeItemsFromContentList([this._files[index]]);
			}
		}
	}

	contentListItemEditDescriptionHandler(e) {
		const { detail } = e;

		if (!detail) {
			return;
		}

		const { id, description } = detail;

		if (id && description) {
			const index = this._files.findIndex(c => c.id === id);
			if (index >= 0 && index < this._files.length) {
				this._files[index].description = description;
				this._files[index][this.dateField] = (new Date()).toISOString();
				this.requestUpdate();
			}
		}
	}

	contentListItemOwnerHandler(e) {
		const { detail } = e;

		if (!detail) {
			return;
		}

		const { id, userId, displayName } = detail;

		if (id && displayName) {
			const index = this._files.findIndex(c => c.id === id);
			if (index >= 0 && index < this._files.length) {
				this._files[index].ownerId = userId;
				this._files[index].ownerDisplayName = displayName;
				this._files[index][this.dateField] = (new Date()).toISOString();
				e.detail.bulk ? {} : this.requestUpdate();
			}
		}
	}

	contentListItemRenamedHandler(e) {
		const { detail } = e;

		if (!detail) {
			return;
		}

		const { id, title } = detail;

		if (id && title) {
			const index = this._files.findIndex(c => c.id === id);
			if (index >= 0 && index < this._files.length) {
				this._files[index].title = title;
				this._files[index][this.dateField] = (new Date()).toISOString();
				this.requestUpdate();
			}
		}
	}

	fileDropErrorHandler(e) {
		const errorToastElement = this.shadowRoot.querySelector('#file-drop-toast');
		if (e && e.detail && e.detail.message && errorToastElement) {
			this.fileDropErrorMessage = e.detail.message;
			this.requestUpdate();
			errorToastElement.setAttribute('open', true);
		}
	}

	observeSuccessfulUpload() {
		observe(
			this.uploader,
			'successfulUpload',
			async change => {
				if (change.newValue &&
					change.newValue.content &&
					!this.areAnyFiltersActive()) {
					const newValue = toJS(change.newValue);
					if (this.canTransferOwnership) {
						newValue.ownerDisplayName = await this._getUserDisplayName(newValue.content.ownerId);
					}
					return this.addNewItemIntoContentItems(newValue);
				}
			}
		);
	}

	async openDeleteDialog() {
		await this.shadowRoot.querySelector('#bulk-delete-dialog').open();
	}

	async openTransferOwnershipDialog() {
		this.shadowRoot.querySelector('#bulk-transfer-ownership').open();
	}

	removeItemsFromContentList(items) {
		this.undoDeleteObjects.clear();
		for (const item of items) {
			const index = this._files.findIndex(c => c.id === item.id);
			if (this._files[index].processingStatus === 'deleting') this._files[index].processingStatus = 'ready';
			this._files[index].selected = false;
			this.undoDeleteObjects.add(this._files[index]);
		}
		this._files = this._files.filter((f) => { return ![...items].some((i) => i.id === f.id); });
		this.updateAfterDeleted(items.size || items.length);
	}

	renderContentItem(item) {
		const processing = item.processingStatus === 'created' || item.processingStatus === 'deleting' || item.processingStatus === 'transferring';
		return html`
		<content-list-item
			id=${item.id}
			revision-id=${item.revisionId}
			owner-id=${item.ownerId}
			title=${item.title}
			poster=${ifDefined(item.poster)}
			description=${item.description}
			?can-transfer-ownership=${this.canTransferOwnership}
			processing-status=${item.processingStatus}
			?disabled=${processing}
			?selected=${item.selected}
			?selectable=${this.showBulkActions}
			type=${item.type}
			@content-list-item-renamed=${this.contentListItemRenamedHandler}
			@content-list-item-edit-description=${this.contentListItemEditDescriptionHandler}
			@content-list-item-deleted=${this.contentListItemDeletedHandler}
			@content-list-item-owner-changed=${this.contentListItemOwnerHandler}
		>
			<div slot="title" class="title">${item.title}</div>
			<div slot="description">${item.description}</div>
			<div slot="owner">${item.ownerDisplayName}</div>
			${processing ?
		(item.processingStatus === 'created' ? html`<div slot="date">${this.localize('processing')}</div>` :
			html`<div slot="date">${this.localize(item.processingStatus)}</div>`) :
		html`<relative-date slot="date" value=${item[this.dateField]}></relative-date>`}
		</content-list-item>
		`;
	}

	renderGhosts() {
		this.allSelected = false;
		this.requestUpdate();
		return new Array(5).fill().map(() => html`
			<d2l-list>
				<content-list-item-ghost
				?hidden=${!this.loading}
				?selectable=${this.showBulkActions}
				></content-list-item-ghost>
			</d2l-list>
		`);
	}

	showUndoDeleteToast(numDeleted) {
		const deleteToastElement = this.shadowRoot.querySelector('#delete-toast');

		if (deleteToastElement) {
			deleteToastElement.removeAttribute('open');
			this.alertToastMessage = this.localize('removedFiles', { count: numDeleted });
			this.alertToastButtonText = this.localize('undo');
			deleteToastElement.setAttribute('open', true);
		}
	}

	async undoDeleteHandler() {
		this.inProgress = true;
		const deleteToastElement = this.shadowRoot.querySelector('#delete-toast');

		if (deleteToastElement && this.undoDeleteObjects.size > 0) {
			deleteToastElement.removeAttribute('open');
			for (const item of this.undoDeleteObjects) {
				if (!item.id) {
					continue;
				}
				await this.apiClient.content.updateItem({
					content: { id: item.id, deletedAt: null }
				});

				if (!this.areAnyFiltersActive()) {
					await this.insertIntoContentItemsBasedOnSort(item);
				}
			}

			this.alertToastMessage = this.localize('restoredFiles', { count: this.undoDeleteObjects.size });
			this.undoDeleteObjects.clear();
			this.alertToastButtonText = '';
			this.requestUpdate();
			deleteToastElement.setAttribute('open', true);
		}
		this.inProgress = false;
	}

	updateAfterDeleted(numDeleted = 1) {
		this.requestUpdate();
		this.showUndoDeleteToast(numDeleted);

		if (this._files.length < this._resultSize && this._moreResultsAvailable && !this.loading) {
			this.loadNext();
			this.allSelected = false;
		}
	}

	updateVideoProcessingStatus(event) {
		const { contentId, processingStatus } = event.detail;
		if (!(contentId && processingStatus)) {
			return;
		}
		const index = this._files.findIndex(c => c.id === contentId);
		const item = this._files[index];
		item && (item.processingStatus = processingStatus);
		this.requestUpdate();
	}

	async _getUserDisplayName(userId) {
		if (!this.userDisplayName) {
			try {
				const { DisplayName } = await this.userBrightspaceClient.getUser({ userId });
				this.userDisplayName = DisplayName || userId;
			} catch (error) {
				this.userDisplayName = userId;
			}
		}

		return this.userDisplayName;
	}

	_onSelectAllChange(event) {
		const { selected } = event.detail;
		const items = this.shadowRoot.querySelectorAll('content-list-item');
		if (selected) {
			for (const item of items) {
				if (item.processingStatus === 'ready') this.selectedItems.add(item);
			}
		} else {
			this.selectedItems.clear();
		}
		for (let i = 0; i < this._files.length; i++) {
			if (this._files[i].processingStatus === 'ready') {
				this._files[i].selected = selected;
			}
		}
		this.allSelected = selected;
		this.requestUpdate();
	}

	_onSelectChange(event) {
		const { key, selected } = event.detail;
		const item = this.shadowRoot.getElementById(key);
		if (!item) return;
		if (selected) {
			this.selectedItems.add(item);
		} else {
			this.selectedItems.delete(item);
			this.allSelected = false;
		}
		const index = this._files.findIndex(c => c.id === key);
		this._files[index].selected = selected;
		this.requestUpdate();
	}

}

window.customElements.define('content-list', ContentList);
