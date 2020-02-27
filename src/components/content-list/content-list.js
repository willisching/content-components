import { css, html, LitElement } from 'lit-element/lit-element.js';
import {
	bodyCompactStyles,
	bodySmallStyles,
	labelStyles
} from '@brightspace-ui/core/components/typography/styles.js';

// Polyfills
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/icons/icon.js';
import './content-list-item.js';
import './content-list-item-ghost.js';
import './content-list-header.js';
import '../content-icon.js';
import '../relative-date.js';

import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { typeLocalizationKey } from '../../util/content-type.js';

class ContentList extends DependencyRequester(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			contentItems: { type: Array, attribute: false },
			loading: { type: Boolean, attribute: false }
		};
	}

	static get styles() {
		return [bodyCompactStyles, bodySmallStyles, labelStyles, css`
			:host([hidden]) {
				display: none;
			}

			.title {
				word-break: break-word;
			}
		`];
	}

	constructor() {
		super();
		this.contentItems = [];
		this.infiniteScrollThreshold = 400;
		this.resultSize = 20;
		this.dateField = 'updatedAt';
		this.sortQuery = '';
		this.totalResults = 0;
		this.loading = false;
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
	}

	onWindowScroll() {
		const contentListElem = this.shadowRoot.querySelector('#d2l-content-store-list');
		const bottom = contentListElem.getBoundingClientRect().top + window.pageYOffset + contentListElem.clientHeight;
		const scrollY = window.pageYOffset + window.innerHeight;
		if (bottom - scrollY < this.infiniteScrollThreshold && this.contentItems.length < this.totalResults) {
			this.loadNext();
		}
	}

	changeSort({ detail = {} }) {
		if (/^(createdAt|updatedAt)$/.test(detail.sortKey)) {
			this.dateField = detail.sortKey;
		}

		this.sortQuery = detail.sortQuery;
		this.reloadPage();
	}

	async reloadPage() {
		this.contentItems = [];
		await this.loadNext();
		window.addEventListener('scroll', this.onWindowScroll.bind(this));
	}

	async loadNext() {
		if (this.loading) {
			return;
		}

		this.loading = true;
		const searchResult = await this.apiClient.searchContent({
			start: this.contentItems.length,
			size: this.resultSize,
			sort: this.sortQuery
		});
		this.totalResults = searchResult.hits.total;
		this.contentItems.push(...searchResult.hits.hits.map(item => item._source));
		this.loading = false;
		this.update();
	}

	render() {
		return html`
			<content-list-header @change-sort=${this.changeSort}></content-list-header>
			<div id="d2l-content-store-list">
				${this.renderNotFound()}
				${this.contentItems.map(item => this.renderContentItem(item))}
				${this.renderGhosts(this.loading ? 5 : 0)}
			</div>
		`;
	}

	renderContentItem(item) {
		const { lastRevType: type } = item;
		const lkey = typeLocalizationKey(type);
		const iconType = lkey ? this.localize(lkey) : type;
		return html`
		<content-list-item
			id=${item.id}
			revision-id=${item.lastRevId}
			selectable
			type=${type}
		>
			<content-icon type="${iconType}" slot="icon"></content-icon>
			<div slot="title" class="title">${item.lastRevTitle}</div>
			<div slot="type">${type}</div>
			<relative-date slot="date" value=${item[this.dateField]}></relative-date>
		</content-list-item>
		`;
	}

	renderGhosts(count) {
		return new Array(count).fill().map(() => html`
			<d2l-list><content-list-item-ghost></content-list-item-ghost></d2l-list>
		`);
	}

	renderNotFound() {
		return !this.loading && this.contentItems.length === 0 ? html`
			<d2l-list>
				<d2l-list-item class="d2l-body-compact">
					${this.localize('noResultsFound')}
				</d2l-list-item>
			</d2l-list>
		` : html``;
	}
}

window.customElements.define('content-list', ContentList);
