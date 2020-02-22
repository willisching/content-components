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
import './content-icon.js';
import './relative-date.js';
import './content-skeleton.js';

import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin.js';
import { DependencyRequester } from '../mixins/dependency-requester-mixin.js';
import { typeLocalizationKey } from '../util/content-type.js';

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

			.col-container {
				display: flex;
				flex-wrap: wrap;
			}

			.col {
				display: flex;
				flex-direction: column;
			}
			.col.detail {
				width: 60%;
			}
			.col.detail .type.d2l-body-small {
				margin-left: 0;
			}
			.col.created-at {
				width: 20%;
			}
			.col.updated-at {
				width: 20%;
			}

			d2l-list.table-header {
				font-weight: bold;
			}

			content-skeleton:not(.illustration) {
				margin: 8px 0 4px 0;
			}

			.col.detail content-skeleton.title{
				width: 95%;
				height: 11px;
				max-width: 300px;
			}

			.col.detail content-skeleton.type{
				width: 24px;
				height: 10px;
			}

			.col.created-at content-skeleton {
				height: 11px;
				max-width: 100px;
				width: 95%;
			}

			.col.updated-at content-skeleton {
				height: 11px;
				max-width: 100px;
				width: 95%;
			}

			content-skeleton.illustration {
				width: 42px;
				height: 42px;
			}

			d2l-list.table-header content-icon {
				height: 0;
				padding-left: 42px; /* total width of checkbox column */
			}

			d2l-list.table-header [slot=actions] {
				height: 0;
				width: 90px;
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
			<d2l-list class="table-header" separators="none">
				${this.renderTableHeader()}
			</d2l-list>
			<d2l-list id="d2l-content-store-list">
				${this.contentItems.map(item => this.renderContentItem(item))}
				${this.loading ? this.renderContentItemSkeletons(5) : html``}
			</d2l-list>
		`;
	}

	renderContentItemSkeletons(count) {
		const skeletonTemplates = [];
		for (let i = 0; i < count; i++) {
			skeletonTemplates.push(html`
			<d2l-list-item class="d2l-body-compact" ?selectable=${this.contentItemsSelectable} disabled>
				<content-skeleton class="illustration" slot="illustration"></content-skeleton>
				<div class="col-container">
					<div class="col detail">
						<content-skeleton class="title"></content-skeleton>
						<content-skeleton class="type"></content-skeleton>
					</div>
					<div class="col created-at">
						<content-skeleton></content-skeleton>
					</div>
					<div class="col updated-at">
						<content-skeleton></content-skeleton>
					</div>
				</div>
				<div slot="actions">
					<d2l-button-icon
						text="${this.localize('preview')}"
						icon="tier1:preview"
						disabled
					></d2l-button-icon>
					<d2l-button-icon
						text="${this.localize('more')}"
						icon="tier1:more"
						disabled
					></d2l-button-icon>
				</div>
			</d2l-list-item>
			`);
		}

		return skeletonTemplates;
	}

	renderTableHeader() {
		return html`
			<d2l-list-item class="d2l-label-text">
				<content-icon type="" slot="illustration"></content-icon>
				<div class="col-container">
					<div class="col detail">${this.localize('name')}</div>
					<div class="col created-at">${this.localize('created')}</div>
					<div class="col updated-at">${this.localize('modified')}</div>
				</div>
				<div slot="actions"></div>
			</d2l-list-item>
		`;
	}

	renderContentItem(item) {
		const {
			createdAt,
			updatedAt,
			id,
			lastRevId: revisionId,
			lastRevType: type,
			lastRevTitle: title
		} = item;
		const lkey = typeLocalizationKey(type);
		const iconType = lkey ? this.localize(lkey) : type;
		return html`
			<d2l-list-item class="d2l-body-compact" ?selectable=${this.contentItemsSelectable}>
				<content-icon type="${iconType}" slot="illustration"></content-icon>
				<div class="col-container">
					<div class="col detail">
						<div class="title">${title}</div>
						<div class="type d2l-body-small">${type}</div>
					</div>
					<relative-date class="col created-at" value=${createdAt}></relative-date>
					<relative-date class="col updated-at" value=${updatedAt || createdAt}></relative-date>
				</div>
				<div slot="actions">
					<d2l-button-icon
						@click=${this.openPreview(id, revisionId)}
						text="${this.localize('preview')}"
						icon="tier1:preview"
					></d2l-button-icon>
					<d2l-button-icon text="${this.localize('more')}" icon="tier1:more"></d2l-button-icon>
				</div>
			</d2l-list-item>
		`;
	}

	openPreview(contentId, revisionId) {
		return async() => {
			const previewWindow = window.open('', '_blank');
			const { previewUrl } = await this.apiClient.getPreviewUrl({ contentId, revisionId });
			previewWindow.location.href = previewUrl;
		};
	}
}

window.customElements.define('content-list', ContentList);
