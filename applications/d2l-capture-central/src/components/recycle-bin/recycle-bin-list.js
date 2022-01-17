import '@brightspace-ui/core/components/alert/alert-toast.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list.js';
import '../content-file-drop.js';
import '../relative-date.js';
import './recycle-bin-list-header.js';
import './recycle-bin-item-ghost.js';
import './recycle-bin-item.js';
import { CaptureCentralList, recycleBinPage  } from '../capture-central-list.js';

import { html } from 'lit-element/lit-element.js';

class RecycleBinList extends CaptureCentralList {
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
			<content-file-drop>
			<d2l-list>
				<div id="d2l-content-store-list">
					${this.renderNotFound()}
					${this._videos.map(item => this.renderRecycleBinItem(item))}
					${this.renderGhosts()}
				</div>
			</d2l-list>
			</content-file-drop>

			<d2l-alert-toast
				id="restored-toast"
				type="default"
				button-text=${this.alertToastButtonText}
				announce-text=${this.alertToastMessage}>
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
		const contentListElem = this.shadowRoot.querySelector('#d2l-content-store-list');
		if (contentListElem) {
			const bottom = contentListElem.getBoundingClientRect().top + window.pageYOffset + contentListElem.clientHeight;
			const scrollY = window.pageYOffset + window.innerHeight;
			if (bottom - scrollY < this.infiniteScrollThreshold && this._moreResultsAvailable && !this.loading) {
				this.loadNext();
			}
		}
	}

	async recycleBinItemRestoredHandler(e) {
		const { detail } = e;

		if (!detail || !detail.id) {
			return;
		}

		const index = this._videos.findIndex(c => c.id === detail.id);

		if (index >= 0 && index < this._videos.length) {
			await this.apiClient.undeleteContent({ contentId: detail.id });
			this._videos.splice(index, 1);

			this.alertToastMessage = this.localize('restoredFile');
			this.alertToastButtonText = '';
			this.requestUpdate();
			this.showRestoredToast();

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
			title=${item.title}
			@recycle-bin-item-restored=${this.recycleBinItemRestoredHandler}
		>
			<d2l-icon icon="tier1:file-video" slot="icon"></d2l-icon>
			<div slot="title" class="title">${item.title}</div>
			<div slot="type">${item.type}</div>
			<relative-date slot="date" value=${item[this.dateField]}></relative-date>
			<div slot="expiry" class=d2l-body-small>Permanently deleted in ${numDays} ${numDays === 1 ? 'day' : 'days'}</div>
		</recycle-bin-item>
		`;
	}

	showRestoredToast() {
		const restoredToastElement = this.shadowRoot.querySelector('#restored-toast');

		if (restoredToastElement) {
			restoredToastElement.removeAttribute('open');
			this.alertToastMessage = this.localize('restoredFile');
			restoredToastElement.setAttribute('open', true);
		}
	}

}

window.customElements.define('recycle-bin-list', RecycleBinList);
