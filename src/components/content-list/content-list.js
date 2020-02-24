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
		`];
	}

	constructor() {
		super();
		this.contentItems = [];
		this.contentItemsSelectable = true;
		this.infiniteScrollThreshold = 400;
		this.resultSize = 20;
		this.totalResults = 0;
		this.loading = false;
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
		this.loadPage();
	}

	async loadPage() {
		await this.loadNext();
		window.addEventListener('scroll', this.onWindowScroll.bind(this));
	}

	onWindowScroll() {
		const contentListElem = this.shadowRoot.querySelector('#d2l-content-store-list');
		const bottom = contentListElem.getBoundingClientRect().top + window.pageYOffset + contentListElem.clientHeight;
		const scrollY = window.pageYOffset + window.innerHeight;
		if (bottom - scrollY < this.infiniteScrollThreshold && this.contentItems.length < this.totalResults) {
			this.loadNext();
		}
	}

	async loadNext() {
		if (this.loading) {
			return;
		}

		this.loading = true;
		const searchResult = await this.apiClient.searchContent({ start: this.contentItems.length, size: this.resultSize, sort: 'updatedAt:desc' });
		this.totalResults = searchResult.hits.total;
		this.contentItems.push(...searchResult.hits.hits.map(item => item._source));
		this.loading = false;
		this.update();
	}

	render() {
		return html`
			<content-list-header></content-list-header>
			<d2l-list id="d2l-content-store-list">
				${this.contentItems.map(item => this.renderContentItem(item))}
				${this.renderGhosts(this.loading ? 5 : 0)}
			</d2l-list>
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
			?selectable=${this.contentItemsSelectable}
		>
			<content-icon type="${iconType}" slot="icon"></content-icon>
			<div slot="title">${item.lastRevTitle}</div>
			<div slot="type">${type}</div>
			<relative-date slot="date" value=${item.createdAt}></relative-date>
		</content-list-item>
		`;
	}

	renderGhosts(count) {
		return new Array(count).fill().map(() => html`
			<content-list-item-ghost></content-list-item-ghost>
		`);
	}
}

window.customElements.define('content-list', ContentList);
