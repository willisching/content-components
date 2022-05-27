import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/dropdown/dropdown-more.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import '@brightspace-ui/core/components/dialog/dialog.js';
import '@brightspace-ui/core/components/dialog/dialog-confirm.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import './recycle-bin-list-columns.js';

import {
	bodyCompactStyles,
	bodySmallStyles
} from '@brightspace-ui/core/components/typography/styles.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { navigationMixin } from '../../mixins/navigation-mixin.js';
import { rootStore } from '../../state/root-store.js';

class RecycleBinItem extends DependencyRequester(navigationMixin(InternalLocalizeMixin(LitElement))) {
	static get properties() {
		return {
			confirmDisabled: { type: Boolean, attribute: false },
			description: { type: String },
			disabled: { type: Boolean },
			dropdownBoundary: { type: Object, attribute: false },
			id: { type: String },
			poster: { type: String },
			revisionId: { type: String, attribute: 'revision-id' },
			selectable: { type: Boolean },
			title: { type: String },
			type: { type: String },
			deleted: {type: Boolean},
		};
	}

	static get styles() {
		return [bodyCompactStyles, bodySmallStyles, css`
			.actions {
				position: relative;
			}
			recycle-bin-list-columns div {
				margin-right: 5px;
			}
			.d2l-capture-central-deleted-item-illustration {
				align-items: center;
				display: flex;
				height: 64px;
				justify-content: center;
				width: 64px;
			}
			.d2l-capture-central-deleted-poster-image {
				height: 100%;
				object-fit: cover;
				width: 100%;
			}
		`];
	}

	constructor() {
		super();
		this.selectable = false; // Hide checkboxes until bulk actions are implemented
		this.dropdownBoundary = {};
		this.content = null;
		this.confirmDisabled = false;
		this.deleted = false;
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
	}

	firstUpdated() {
		super.firstUpdated();
		this.addEventListener('d2l-dropdown-close', this.dropdownClosed);
		this.addEventListener('d2l-dropdown-open', this.adjustDropdownBoundary);
	}

	render() {
		const icon = !this.type || this.type === 'Video' ? 'tier1:file-video' : 'tier1:file-audio';
		const illustration = (this.poster && this.poster !== '') ? html`
			<img class="d2l-capture-central-deleted-poster-image" src="${this.poster}" slot="illustration">
		` : html`
			<d2l-icon icon="${icon}" slot="illustration"></d2l-icon>
		`;

		return html`
			<d2l-list-item class="d2l-body-compact"
				?disabled=${this.disabled}
				label="${this.title}"
				padding-type='slim'
				?selectable=${this.selectable}
				key=${this.id}
			>
				<div class="d2l-capture-central-deleted-item-illustration" slot="illustration">
					${illustration}
				</div>

				<recycle-bin-list-columns>
					<div slot="detail">
						<slot name="title"></slot>
						<slot name="description" class="d2l-body-small"></slot>
					</div>
					<div slot="date">
						<slot name="date"></slot>
						<slot name="expiry"></slot>
					</div>
				</recycle-bin-list-columns>

				<div slot="actions" id="actions" class="actions">
					<d2l-dropdown-more text="${this.localize('moreActions')}" @click=${this.dropdownClicked} ?disabled=${this.disabled}>
						<d2l-dropdown-menu id="actions-dropdown-menu" align="end" boundary=${JSON.stringify(this.dropdownBoundary)}>
							<d2l-menu label="${this.localize('moreActions')}">
								<d2l-menu-item text="${this.localize('restore')}" @click="${this.restore()}"></d2l-menu-item>
								${rootStore.permissionStore.getCanManageAllVideos() ? html`
									<d2l-menu-item text="${this.localize('deletePermanently')}" @click="${this.destroyHandler()}"></d2l-menu-item>
								` : ''}
							</d2l-menu>
						</d2l-dropdown-menu>
					</d2l-dropdown-more>
				</div>
				<d2l-dialog-confirm
					id="d2l-capture-central-confirm-destroy"
					class="d2l-capture-central-confirm-destroy"
					title-text="${this.localize('confirmDeletePermanently')}"
					text="${this.localize('confirmDeleteMessage', {fileName: this.title})}
					${this.localize('permanentActionWarning')}"
				>
					<d2l-button
						@click="${this.destroy()}"
						data-dialog-action="yes"
						primary
						slot="footer"
					>
					${this.localize('deletePermanently')}
					</d2l-button>
					<d2l-button
						data-dialog-action="no"
						slot="footer"
					>
					${this.localize('cancel')}
					</d2l-button>
				</d2l-dialog-confirm>
			</d2l-list-item>
		`;
	}

	adjustDropdownBoundary() {
		const target = this.shadowRoot.querySelector('d2l-dropdown-more');
		const topOffsetForDropdownMenu = 25;
		const minimumBoundingTop = 70;

		if (target) {
			const distanceToTop = target.getBoundingClientRect().top;
			const finalBoundingTop = distanceToTop - rootStore.appTop - topOffsetForDropdownMenu;

			this.dropdownBoundary = {
				above: Math.max(finalBoundingTop, minimumBoundingTop)
			};
		}
	}

	destroy() {
		return async() => {
			await this.apiClient.content.deleteItem({
				id: this.id,
				hardDelete: true
			});
			this.dispatchDestroyEvent();
		};
	}

	destroyHandler() {
		return async() => {
			await this.shadowRoot.querySelector('.d2l-capture-central-confirm-destroy').open();
		};
	}

	dispatchDestroyEvent() {
		this.dispatchEvent(new CustomEvent('recycle-bin-item-destroyed', {
			detail: {
				id: this.id
			}
		}));
	}

	dispatchRestoreEvent() {
		this.dispatchEvent(new CustomEvent('recycle-bin-item-restored', {
			detail: {
				id: this.id
			}
		}));
	}

	restore() {
		return async() => {
			await this.apiClient.content.updateItem({
				content: { id: this.id, deletedAt: null }
			});
			this.dispatchRestoreEvent();
		};
	}
}

window.customElements.define('recycle-bin-item', RecycleBinItem);
