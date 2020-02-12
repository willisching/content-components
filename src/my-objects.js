import { css, html } from 'lit-element/lit-element.js';
import {
	bodyCompactStyles,
	bodySmallStyles,
	heading2Styles,
	labelStyles
} from '@brightspace-ui/core/components/typography/styles.js';

// Polyfills
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/icons/icon.js';
import './components/content-icon.js';
import './components/relative-date.js';

import { DependencyRequester } from './mixins/dependency-requester-mixin.js';
import { PageViewElement } from './components/page-view-element.js';
import { typeLocalizationKey } from './util/content-type.js';

class MyObjects extends DependencyRequester(PageViewElement) {
	static get properties() {
		return {
			contentItems: { type: Array }
		};
	}

	static get styles() {
		return [bodyCompactStyles, bodySmallStyles, heading2Styles, labelStyles, css`
			:host {
				display: block;
				padding: 0 1em;
			}
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
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
		this.loadPage();
	}

	async loadPage() {
		this.contentItems = await this.apiClient.listContent();
	}

	render() {
		return html`
			<h2 class="d2l-heading-2 h2-custom">${this.localize('myContent')}</h2>
			<d2l-list class="table-header" separators="none">
				${this.renderTableHeader()}
			</d2l-list>
			<d2l-list>
				${this.contentItems.map(this.renderContentItem.bind(this))}
			</d2l-list>
		`;
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
		const { createdAt, updatedAt } = item;
		const revisions = item.revisions || [];
		const rev = revisions[revisions.length - 1] || {};
		const lkey = typeLocalizationKey(rev.type);
		const type = lkey ? this.localize(lkey) : rev.type;
		return html`
			<d2l-list-item class="d2l-body-compact" ?selectable=${this.contentItemsSelectable}>
				<content-icon type="${rev.type}" slot="illustration"></content-icon>
				<div class="col-container">
					<div class="col detail">
						<div class="title">${rev.title}</div>
						<div class="type d2l-body-small">${type}</div>
					</div>
					<relative-date class="col created-at" value=${createdAt}></relative-date>
					<relative-date class="col updated-at" value=${updatedAt || createdAt}></relative-date>
				</div>
				<div slot="actions">
					<d2l-button-icon icon="tier1:preview"></d2l-button-icon>
					<d2l-button-icon icon="tier1:more"></d2l-button-icon>
				</div>
			</d2l-list-item>
		`;
	}
}

window.customElements.define('my-objects', MyObjects);
