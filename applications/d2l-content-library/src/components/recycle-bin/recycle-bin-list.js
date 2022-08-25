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
	constructor() {
		super();
		this.page = recycleBinPage;
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
		this.reloadPage();
	}

	render() {
		return html`
			<recycle-bin-list-header @change-sort=${this.changeSort}></recycle-bin-list-header>
			<d2l-list>
				<div id="d2l-content-library-list">
					${this.renderNotFound()}
					${this._videos.map(item => this.renderRecycleBinItem(item))}
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
		this.removeFromRecycleBin(e);
		this.requestUpdate();
		this.showToast('restoredFile');
	}

	removeFromRecycleBin(e) {
		const { detail } = e;

		if (!detail || !detail.id) {
			return;
		}

		const index = this._videos.findIndex(c => c.id === detail.id);
		if (index >= 0 && index < this._videos.length) {
			this._videos.splice(index, 1);

			if (this._videos.length < this._resultSize && this._moreResultsAvailable && !this.loading) {
				this.loadNext();
			}
		}
	}

	renderGhosts() {
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
			@recycle-bin-item-restored=${this.recycleBinItemRestoredHandler}
			@recycle-bin-item-destroyed=${this.recycleBinItemDestroyHandler}
		>
			<div slot="title" class="title">${item.title}</div>
			<div slot="description">${item.description}</div>
			<relative-date slot="date" value=${item[this.dateField]}></relative-date>
			<div slot="expiry" class=d2l-body-small>${this.localize('permanentlyDeletedIn', { count: numDays })}</div>
		</recycle-bin-item>
		`;
	}

	showToast(alertLocaleKey) {
		const toastElement = this.shadowRoot.querySelector('#recycle-bin-toast');
		if (toastElement) {
			toastElement.removeAttribute('open');
			this.alertToastMessage = this.localize(alertLocaleKey);
			toastElement.setAttribute('open', true);
		}
	}

}

window.customElements.define('recycle-bin-list', RecycleBinList);
