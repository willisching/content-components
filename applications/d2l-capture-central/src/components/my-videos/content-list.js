import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list.js';
import '../content-file-drop.js';
import '../relative-date.js';
import './content-list-header.js';
import './content-list-item-ghost.js';
import './content-list-item.js';
import { CaptureCentralList, myVideosPage } from '../capture-central-list.js';

import { html } from 'lit-element/lit-element.js';
import { observe, toJS } from 'mobx';

import { rootStore } from '../../state/root-store.js';

class ContentList extends CaptureCentralList {
	constructor() {
		super();
		this.page = myVideosPage;
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
		this.uploader = this.requestDependency('uploader') || rootStore.uploader;
		this.observeSuccessfulUpload();
		this.reloadPage();
	}

	render() {
		return html`
			<content-list-header @change-sort=${this.changeSort}></content-list-header>
			<content-file-drop>
			<d2l-list>
				<div id="d2l-content-store-list">
					${this.renderNotFound()}
					${this._videos.map(item => this.renderContentItem(item))}
					${this.renderGhosts()}
				</div>
			</d2l-list>
			</content-file-drop>

			<d2l-alert-toast
				id="delete-toast"
				type="default"
				button-text=${this.alertToastButtonText}
				announce-text=${this.alertToastMessage}
				@d2l-alert-button-pressed=${this.undoDeleteHandler}>
				${this.alertToastMessage}
			</d2l-alert-toast>
		`;
	}

	contentListItemDeletedHandler(e) {
		if (e && e.detail && e.detail.id) {
			const { id } = e.detail;
			const index = this._videos.findIndex(c => c.id === id);

			if (index >= 0 && index < this._videos.length) {
				this.undoDeleteObject = this._videos[index];
				this._videos.splice(index, 1);
				this.requestUpdate();
				this.showUndoDeleteToast();

				if (this._videos.length < this._resultSize && this._moreResultsAvailable && !this.loading) {
					this.loadNext();
				}
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
			const index = this._videos.findIndex(c => c.id === id);
			if (index >= 0 && index < this._videos.length) {
				this._videos[index].title = title;
				this._videos[index][this.dateField] = (new Date()).toISOString();
				this.requestUpdate();
			}
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
					return this.addNewItemIntoContentItems(toJS(change.newValue));
				}
			}
		);
	}

	renderContentItem(item) {
		return html`
		<content-list-item
			id=${item.id}
			revision-id=${item.revisionId}
			title=${item.title}
			@content-list-item-renamed=${this.contentListItemRenamedHandler}
			@content-list-item-deleted=${this.contentListItemDeletedHandler}
		>
			<d2l-icon icon="tier1:file-video" slot="icon"></d2l-icon>
			<div slot="title" class="title">${item.title}</div>
			<div slot="type">${item.type}</div>
			<relative-date slot="date" value=${item[this.dateField]}></relative-date>
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
			await this.apiClient.undeleteContent({ contentId: this.undoDeleteObject.id });

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
}

window.customElements.define('content-list', ContentList);
