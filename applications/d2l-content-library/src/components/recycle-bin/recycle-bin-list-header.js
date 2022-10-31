// Polyfills
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/list/list-item.js';
import './recycle-bin-list-columns.js';
import '../column-header.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../../../../mixins/internal-localize-mixin.js';
import { labelStyles } from '@brightspace-ui/core/components/typography/styles.js';

class RecycleBinListHeader extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			allSelected: { type: Boolean, attribute: 'all-selected' },
			anySelected: { type: Boolean, attribute: 'any-selected' },
			disableSelectAll: { type: Boolean, attribute: 'disable-select-all' }
		};
	}

	static get styles() {
		return [labelStyles, css`
			:host {
				font-weight: bold;
			}

			:host([hidden]) {
				display: none;
			}

			.d2l-icon-spacer {
				height: 0;
				width: 42px;
				padding-left: 24px; /* total width of checkbox column */
			}

			d2l-list [slot=actions] {
				height: 0;
				width: 45px;
			}
		`];
	}

	constructor() {
		super();
		this.allSelected = false;
		this.anySelected = false;
	}

	render() {
		return html`
		<d2l-list separators="none">
			<d2l-list-item class="d2l-label-text">
			<d2l-selection-input slot="illustration"
			@d2l-selection-change="${this._selectAllChange}"
			?selected=${this.allSelected}
			?disabled=${this.disableSelectAll}
			label="select-all">
			</d2l-selection-input>
				<div class="d2l-icon-spacer" slot="illustration"></div>
				<recycle-bin-list-columns>
					<column-header slot="detail" group="recycle-bin-list">
						<column-header-choice
							label="${this.localize('name')}"
							sort-key="lastRevTitle.keyword"
						></column-header-choice>
					</column-header>
					<column-header slot="date" group="recycle-bin-list">
						<column-header-choice
							current-sort-desc
							label=${this.localize('created')}
							sort-key="createdAt"
						></column-header-choice>
						<column-header-choice
							current-choice
							current-sort-desc
							label=${this.localize('deleted')}
							sort-key="updatedAt"
						></column-header-choice>
					</column-header>
				</recycle-bin-list-columns>
				<div slot="actions" id="actions" class="actions">
				<d2l-dropdown-more id="more-actions-header" text="${this.localize('moreActions')}" ?disabled=${!this.anySelected}>
					<d2l-dropdown-menu id="actions-dropdown-menu-header" align="end" boundary=${JSON.stringify(this.dropdownBoundary)}  ?disabled=${!this.anySelected}>
						<d2l-menu label="${this.localize('moreActions')}">
							<d2l-menu-item text="${this.localize('restore')}" @d2l-menu-item-select="${this.dispatchRestoreEvent}"></d2l-menu-item>
						</d2l-menu>
					</d2l-dropdown-menu>
				</d2l-dropdown-more>
			</div>
			</d2l-list-item>
		</d2l-list>
		`;
	}

	dispatchRestoreEvent() {
		this.dispatchEvent(new CustomEvent('recycle-bin-list-items-restored', { bubbles: true, composed: true }));
	}

	_selectAllChange(e) {
		const detail = e.detail;
		if (this.allSelected === e.detail.selected) {
			return;
		}
		this.allSelected = e.detail.selected;
		this.dispatchEvent(new CustomEvent('select-all-change', { detail, bubbles: true, composed: true }));
	}

}

window.customElements.define('recycle-bin-list-header', RecycleBinListHeader);
