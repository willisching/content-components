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
	constructor() {
		super();
		this.page = filesPage;
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
		`;
	}

	contentListItemDeletedHandler(e) {
		if (e && e.detail && e.detail.id) {
			const { id } = e.detail;
			const index = this._files.findIndex(c => c.id === id);

			if (index >= 0 && index < this._files.length) {
				this.undoDeleteObject = this._files[index];
				this._files.splice(index, 1);
				this.requestUpdate();
				this.showUndoDeleteToast();

				if (this._files.length < this._resultSize && this._moreResultsAvailable && !this.loading) {
					this.loadNext();
				}
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
				this.requestUpdate();
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

	renderContentItem(item) {
		const processing = item.processingStatus === 'created';
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
			?disabled=${item.processingStatus === 'created'}
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
		html`<div slot="date">${this.localize('processing')}</div>` :
		html`<relative-date slot="date" value=${item[this.dateField]}></relative-date>`}
		</content-list-item>
		`;
	}

	renderGhosts() {
		return new Array(5).fill().map(() => html`
			<d2l-list>
				<content-list-item-ghost ?hidden=${!this.loading}></content-list-item-ghost>
			</d2l-list>
		`);
	}

	showUndoDeleteToast() {
		const deleteToastElement = this.shadowRoot.querySelector('#delete-toast');

		if (deleteToastElement) {
			deleteToastElement.removeAttribute('open');
			this.alertToastMessage = this.localize('removedFile');
			this.alertToastButtonText = this.localize('undo');
			deleteToastElement.setAttribute('open', true);
		}
	}

	async undoDeleteHandler() {
		const deleteToastElement = this.shadowRoot.querySelector('#delete-toast');

		if (deleteToastElement && this.undoDeleteObject && this.undoDeleteObject.id) {
			deleteToastElement.removeAttribute('open');
			await this.apiClient.content.updateItem({
				content: { id: this.undoDeleteObject.id, deletedAt: null }
			});

			if (!this.areAnyFiltersActive()) {
				await this.insertIntoContentItemsBasedOnSort(this.undoDeleteObject);
			}

			this.undoDeleteObject = {};
			this.alertToastMessage = this.localize('restoredFile');
			this.alertToastButtonText = '';
			this.requestUpdate();
			deleteToastElement.setAttribute('open', true);
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
}

window.customElements.define('content-list', ContentList);
