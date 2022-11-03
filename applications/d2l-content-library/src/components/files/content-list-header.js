// Polyfills
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/list/list-item.js';
import './content-list-columns.js';
import '../column-header.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../../../../mixins/internal-localize-mixin.js';
import { labelStyles } from '@brightspace-ui/core/components/typography/styles.js';

class ContentListHeader extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			canTransferOwnership: { type: Boolean, attribute: 'can-transfer-ownership' },
			allSelected: { type: Boolean, attribute: 'all-selected' },
			anySelected: { type: Boolean, attribute: 'any-selected' },
			disableSelectAll: { type: Boolean, attribute: 'disable-select-all' },
			showBulkActions: { type: Boolean, attribute: 'show-bulk-actions' }
		};
	}

	static get styles() {
		return [labelStyles, css`
			:host {
				font-weight: bold;
				overflow-wrap: break-word;
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

			d2l-selection-input {
				position: relative;
				left: 3px;
			}

			d2l-dropdown-more {
				position: relative;
				bottom: 8px;
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
				${this.showBulkActions ? html`
				<d2l-selection-input slot="illustration"
				id="d2l-content-list-select-all"
				@d2l-selection-change="${this._selectAllChange}"
				?selected=${this.allSelected}
				?disabled=${this.disableSelectAll}
				label="select-all">
				</d2l-selection-input>` : html`
				<div class="d2l-icon-spacer" slot="illustration"></div>`}
				<content-list-columns>
					<column-header slot="detail" group="content-list">
						<column-header-choice
							label="${this.localize('name')}"
							sort-key="lastRevTitle.keyword"
						></column-header-choice>
					</column-header>
					<column-header slot="owner" group="content-list" ?hidden=${!this.canTransferOwnership}>
						${this.localize('owner')}
					</column-header>
					<column-header slot="date" group="content-list">
						<column-header-choice
							current-sort-desc
							label=${this.localize('created')}
							sort-key="createdAt"
						></column-header-choice>
						<column-header-choice
							current-choice
							current-sort-desc
							label=${this.localize('modified')}
							sort-key="updatedAt"
						></column-header-choice>
					</column-header>
				</content-list-columns>
				${this.showBulkActions ? html `<div slot="actions" id="actions" class="actions">
					<d2l-dropdown-more id="more-actions-header" text="${this.localize('moreActions')}" ?disabled=${!this.anySelected}>
						<d2l-dropdown-menu id="actions-dropdown-menu-header" align="end" boundary=${JSON.stringify(this.dropdownBoundary)}  ?disabled=${!this.anySelected}>
							<d2l-menu label="${this.localize('moreActions')}">
								${this.canTransferOwnership ? html`
									<d2l-menu-item text="${this.localize('transferOwnership')}" @d2l-menu-item-select="${this.dispatchTransferOwnershipEvent}"></d2l-menu-item>` : ''}
								<d2l-menu-item text="${this.localize('delete')}" @d2l-menu-item-select="${this.dispatchDeletedEvent}"></d2l-menu-item>
							</d2l-menu>
						</d2l-dropdown-menu>
					</d2l-dropdown-more>
				</div>` : ''}
			</d2l-list-item>
		</d2l-list>
		`;
	}

	dispatchDeletedEvent() {
		this.dispatchEvent(new CustomEvent('content-list-items-deleted', {
			bubbles: true,
			composed: true,
		}));
		this.requestUpdate();
	}

	dispatchTransferOwnershipEvent({ userId, displayName }) {
		this.dispatchEvent(new CustomEvent('content-list-items-owner-changed', {
			bubbles: true,
			composed: true,
			detail: {
				userId,
				displayName
			}
		}));
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

window.customElements.define('content-list-header', ContentListHeader);
