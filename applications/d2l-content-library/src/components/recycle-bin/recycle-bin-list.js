import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list.js';
import '../relative-date.js';
import './recycle-bin-list-header.js';
import './recycle-bin-item-ghost.js';
import './recycle-bin-item.js';
import { ContentLibraryList, recycleBinPage } from '../content-library-list.js';

import { html } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';

class RecycleBinList extends ContentLibraryList {
	static get properties() {
		return {
			allSelected: { type: Boolean, attribute: false },
			selectedItems: { type: Object, attribute: false }
		};
	}

	constructor() {
		super();
		this.page = recycleBinPage;
		this.addEventListener('select-all-change', this._onSelectAllChange);
		this.addEventListener('d2l-list-item-selected', this._onSelectChange);
		this.addEventListener('recycle-bin-list-items-restored', this.bulkRestoreHandler);
		this.selectedItems = new Set();
		this.allSelected = false;
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
		this.reloadPage();
	}

	render() {
		return html`
			<recycle-bin-list-header
				@change-sort=${this.changeSort}
				?any-selected=${this.selectedItems.size > 0}
				?all-selected=${this.allSelected}
				?disable-select-all=${!(this._files?.length > 0)}></recycle-bin-list-header>
			<d2l-list>
				<div id="d2l-content-library-list">
					${this.renderNotFound()}
					${this._files.map(item => this.renderRecycleBinItem(item))}
					${this.renderGhosts()}
				</div>
			</d2l-list>

			<d2l-alert-toast
				id="recycle-bin-toast"
				type="default">
				${this.alertToastMessage}
			</d2l-alert-toast>
		`;
	}

	async bulkRestoreHandler() {
		for (const item of this.selectedItems) {
			item.disabled = true;
		}
		for (const item of this.selectedItems) {
			try {
				await item.restore();
			} catch (error) {
				console.warn(`Error while restoring deleted item ${item.id}`, error);
				this.selectedItems.remove(item);
				item.disabled = false;
			}
		}
		this.removeFromRecycleBin(this.selectedItems);
		this.showToast('restoredFiles', { count: this.selectedItems.size });
		this.allSelected = false;
		for (const item of this.selectedItems) {
			item.disabled = false;
		}
		this.selectedItems.clear();
		this.requestUpdate();
	}

	getNumDaysToPermDeletion(item) {
		const millisInDay = 24 * 60 * 60 * 1000;

		const dateDeleted = Date.parse(item[this.dateField]);
		const datePermDeleted = new Date(dateDeleted + 90 * millisInDay);
		const today = new Date();
		const numDays = (datePermDeleted.getTime() - today.getTime()) / millisInDay;
		return Math.round(numDays);
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

	recycleBinItemDestroyHandler(e) {
		this.removeFromRecycleBin(e);
		this.requestUpdate();
		this.showToast('permanentlyDeletedFile');
	}

	recycleBinItemRestoredHandler(e) {
		const { detail } = e;

		if (!detail || !detail.id) {
			return;
		}
		this.removeFromRecycleBin([detail]);
		this.requestUpdate();
		this.showToast('restoredFiles', { count: 1 });
	}

	removeFromRecycleBin(items) {
		this._files = this._files.filter((f) => { return ![...items].some((i) => i.id === f.id); });

		if (this._files.length < this._resultSize && this._moreResultsAvailable && !this.loading) {
			this.loadNext();
			this.allSelected = false;
		}
	}

	renderGhosts() {
		this.allSelected = false;
		return new Array(5).fill().map(() => html`
			<d2l-list>
				<recycle-bin-item-ghost ?hidden=${!this.loading}></recycle-bin-item-ghost>
			</d2l-list>
		`);
	}

	renderRecycleBinItem(item) {
		const numDays = this.getNumDaysToPermDeletion(item);
		return html`
		<recycle-bin-item
			id=${item.id}
			revision-id=${item.revisionId}
			poster=${ifDefined(item.poster)}
			title=${item.title}
			description=${item.description}
			type=${item.type}
			?selected=${item.selected}
			@recycle-bin-item-restored=${this.recycleBinItemRestoredHandler}
			@recycle-bin-item-destroyed=${this.recycleBinItemDestroyHandler}
		>
			<div slot="title" class="title">${item.title}</div>
			<div slot="description">${item.description}</div>
			${item.disabled ? html`<div slot="date">${this.localize('restoring')}</div>` :
		html`<relative-date slot="date" value=${item[this.dateField]}></relative-date>`}
			<div slot="expiry" class=d2l-body-small>${this.localize('permanentlyDeletedIn', { count: numDays })}</div>
		</recycle-bin-item>
		`;
	}

	showToast(alertLocaleKey, args = {}) {
		const toastElement = this.shadowRoot.querySelector('#recycle-bin-toast');
		if (toastElement) {
			toastElement.removeAttribute('open');
			this.alertToastMessage = this.localize(alertLocaleKey, args);
			toastElement.setAttribute('open', true);
		}
	}

	_onSelectAllChange(event) {
		const { selected } = event.detail;
		if (selected) {
			this.selectedItems = new Set(this.shadowRoot.querySelectorAll('recycle-bin-item'));
		} else {
			this.selectedItems.clear();
		}
		for (let i = 0; i < this._files.length; i++) {
			this._files[i].selected = selected;
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

window.customElements.define('recycle-bin-list', RecycleBinList);
