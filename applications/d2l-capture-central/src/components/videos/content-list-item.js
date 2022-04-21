import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list-item-button.js';
import '@brightspace-ui/core/components/dropdown/dropdown-more.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import '@brightspace-ui/core/components/dialog/dialog.js';
import '@brightspace-ui/core/components/dialog/dialog-confirm.js';
import '@brightspace-ui/core/components/inputs/input-text.js';
import './content-list-columns.js';
import './transfer-ownership-dialog.js';

import {
	bodyCompactStyles,
	bodySmallStyles
} from '@brightspace-ui/core/components/typography/styles.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { navigationMixin } from '../../mixins/navigation-mixin.js';
import { pageNames } from '../../util/constants.js';
import { rootStore } from '../../state/root-store.js';
const actionsDefaultZIndex = 2;
const actionsActiveZIndex = 5;
const dialogConfirmAction = 'confirm';

class ContentListItem extends DependencyRequester(navigationMixin(InternalLocalizeMixin(LitElement))) {
	static get properties() {
		return {
			confirmEditDescriptionDisabled: { type: Boolean, attribute: false },
			confirmRenameDisabled: { type: Boolean, attribute: false },
			description: { type: String },
			disabled: { type: Boolean },
			dropdownBoundary: { type: Object, attribute: false },
			id: { type: String },
			poster: { type: String },
			revisionId: { type: String, attribute: 'revision-id' },
			selectable: { type: Boolean },
			title: { type: String },
			ownerId: { type: String, attribute: 'owner-id' },
			canTransferOwnership: { type: Boolean, attribute: 'can-transfer-ownership' },
			processingStatus: { type: String, attribute: 'processing-status' },
			type: { type: String }
		};
	}

	static get styles() {
		return [bodyCompactStyles, bodySmallStyles, css`
			.actions {
				position: relative;
			}
			content-list-columns div {
				margin-right: 5px;
			}
			.break-word {
				overflow-wrap: break-word;
			}

			.d2l-body-compact {
				position: relative;
			}

			.d2l-capture-central-video-item-illustration {
				align-items: center;
				display: flex;
				height: 64px;
				justify-content: center;
				width: 64px;
			}

			.d2l-capture-central-video-poster-image {
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
		this.confirmEditDescriptionDisabled = false;
		this.confirmRenameDisabled = false;
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
		const illustration = (this.poster && this.poster !== '' && this.processingStatus !== 'created') ? html`
			<img class="d2l-capture-central-video-poster-image" src="${this.poster}" slot="illustration">
		` : html`
			<d2l-icon icon="${icon}" slot="illustration"></d2l-icon>
		`;

		return html`
			<d2l-list-item-button class="d2l-body-compact"
				?disabled=${this.disabled}
				@d2l-list-item-button-click=${this.dispatchPreviewEvent}
				label="${this.title}"
				padding-type='slim'
				?selectable=${this.selectable}
				key=${this.id}
			>
				<div class="d2l-capture-central-video-item-illustration" slot="illustration">
					${illustration}
				</div>

				<content-list-columns>
					<div slot="detail">
						<slot name="title"></slot>
						<slot name="description" class="d2l-body-small"></slot>
					</div>
					<div slot="owner" class="break-word">
						<slot name="owner"></slot>
					</div>
					<div slot="date">
						<slot name="date"></slot>
					</div>
				</content-list-columns>

				<div slot="actions" id="actions" class="actions">
					<d2l-dropdown-more text="${this.localize('moreActions')}" @click=${this.dropdownClicked} ?disabled=${this.disabled}>
						<d2l-dropdown-menu id="actions-dropdown-menu" align="end" boundary=${JSON.stringify(this.dropdownBoundary)}>
							<d2l-menu label="${this.localize('moreActions')}">
								<d2l-menu-item text="${this.localize('preview')}" @click=${this.dispatchPreviewEvent}></d2l-menu-item>
								<d2l-menu-item text="${this.localize('download')}" @click="${this.download}"></d2l-menu-item>
								<d2l-menu-item text="${this.localize('edit')}" @click=${this._goTo(`/${pageNames.producer}/${this.id}`)}></d2l-menu-item>
								<d2l-menu-item id="rename-initiator" text="${this.localize('rename')}" @click="${this.openRenameDialog()}"></d2l-menu-item>
								<d2l-menu-item id="edit-description-initiator" text="${this.localize('editDescription')}" @click="${this.openEditDescriptionDialog()}"></d2l-menu-item>
								${this.canTransferOwnership ? html`
									<d2l-menu-item text="${this.localize('transferOwnership')}" @click="${this.openTransferOwnershipDialog()}"></d2l-menu-item>` : ''}
								<d2l-menu-item text="${this.localize('delete')}" @click="${this.deleteHandler()}"></d2l-menu-item>
							</d2l-menu>
						</d2l-dropdown-menu>
					</d2l-dropdown-more>
				</div>

				<d2l-dialog-confirm
					id="d2l-capture-central-confirm-delete"
					class="d2l-capture-central-confirm-delete"
					title-text="${this.localize('confirmDelete')}"
					text="${this.localize('confirmDeleteMessage', {fileName: this.title})}"
				>
				<d2l-button
					@click="${this.delete()}"
					data-dialog-action="yes"
					primary
					slot="footer"
				>
				${this.localize('delete')}
				</d2l-button>
				<d2l-button
					data-dialog-action="no"
					slot="footer"
				>
				${this.localize('cancel')}
				</d2l-button>
				</d2l-dialog-confirm>
			</d2l-list-item-button>

			<d2l-dialog id="edit-description-dialog" title-text="${this.localize('description')}">
				<d2l-input-text
					id="edit-description-input"
					label="${this.localize('description')}"
					label-hidden
					placeholder="${this.localize('descriptionPlaceholder')}"
					value="${this.description || ''}"
					novalidate
					@input="${this.descriptionInputChangedHandler}"
					maxlength=100></d2l-input-text>
				<d2l-button slot="footer" ?disabled=${this.confirmEditDescriptionDisabled} id="edit-description-dialog-confirm" primary dialog-action="${dialogConfirmAction}">${this.localize('save')}</d2l-button>
				<d2l-button slot="footer" id="edit-description-dialog-cancel" dialog-action>${this.localize('cancel')}</d2l-button>
			</d2l-dialog>

			<d2l-dialog id="rename-dialog" title-text="${this.localize('rename')}">
				<d2l-input-text
					id="rename-input"
					label="${this.localize('title')}"
					label-hidden
					placeholder="${this.localize('titlePlaceholder')}"
					value="${this.title}"
					novalidate
					@input="${this.titleInputChangedHandler}"
					maxlength=100></d2l-input-text>
				<d2l-button slot="footer" ?disabled=${this.confirmRenameDisabled} id="rename-dialog-confirm" primary dialog-action="${dialogConfirmAction}">${this.localize('save')}</d2l-button>
				<d2l-button slot="footer" id="rename-dialog-cancel" dialog-action>${this.localize('cancel')}</d2l-button>
			</d2l-dialog>

			${this.canTransferOwnership ? html`
				<d2l-transfer-ownership-dialog
					id="transfer-ownership"
					content-id=${this.id}
					owner-id=${this.ownerId}
					title=${this.title}
					@transfer-ownership-dialog-transfer=${this.transferOwnershipHandler}
				></d2l-transfer-ownership-dialog>` : ''}
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

	delete() {
		return async() => {
			await this.apiClient.deleteContent({
				contentId: this.id
			});
			this.dispatchDeletedEvent();
		};
	}

	deleteHandler() {
		return async() => {
			await this.shadowRoot.querySelector('.d2l-capture-central-confirm-delete').open();
		};
	}

	descriptionInputChangedHandler(event) {
		const descriptionInputValue = event.target.value;
		this.confirmEditDescriptionDisabled = !descriptionInputValue?.trim().length > 0;
	}

	dispatchDeletedEvent() {
		this.dispatchEvent(new CustomEvent('content-list-item-deleted', {
			bubbles: true,
			composed: true,
			detail: {
				id: this.id
			}
		}));
	}

	dispatchEditDescriptionEvent(description) {
		this.dispatchEvent(new CustomEvent('content-list-item-edit-description', {
			bubbles: true,
			composed: true,
			detail: {
				id: this.id,
				description
			}
		}));
	}

	dispatchPreviewEvent() {
		if (this.disabled) {
			return;
		}
		this.dispatchEvent(new CustomEvent('preview', {
			bubbles: true,
			composed: true,
			detail: {
				id: this.id,
			}
		}));
	}

	dispatchRenameEvent(title) {
		this.dispatchEvent(new CustomEvent('content-list-item-renamed', {
			bubbles: true,
			composed: true,
			detail: {
				id: this.id,
				title
			}
		}));
	}

	dispatchTransferOwnershipEvent({ userId, displayName }) {
		this.dispatchEvent(new CustomEvent('content-list-item-owner-changed', {
			bubbles: true,
			composed: true,
			detail: {
				id: this.id,
				userId,
				displayName
			}
		}));
	}

	download() {
		this.apiClient.getSignedUrlForRevision({
			contentId: this.id,
			revisionId: this.revisionId,
			attachment: true
		})
			.then(res => {
				const downloadUrl = res.value;
				if (downloadUrl) {
					const anchor = document.createElement('a');
					anchor.href = downloadUrl;
					anchor.download = '';
					anchor.click();
				}
			});
	}

	// The class "actions" and methods dropdownClicked and dropdownClosed
	// are used to work around an issue with dropdown menus inside a list item: https://github.com/BrightspaceUI/core/issues/399
	dropdownClicked(e) {
		e.stopPropagation();
		if (e && e.target && e.target.parentNode) {
			const actionsDropdownMenu = this.shadowRoot.querySelector('#actions-dropdown-menu');
			const opened = actionsDropdownMenu && actionsDropdownMenu.opened;
			e.target.focus();
			if (opened) {
				e.target.parentNode.style.zIndex = actionsActiveZIndex;
			} else {
				e.target.parentNode.style.zIndex = actionsDefaultZIndex;
			}
		}
	}

	dropdownClosed() {
		const actionsElement = this.shadowRoot.querySelector('#actions');
		if (actionsElement) {
			actionsElement.style.zIndex = actionsDefaultZIndex;
		}
	}

	async editDescription(newDescription) {
		if (this.description !== newDescription) {
			if (!this.content) {
				this.content = await this.apiClient.getContent(this.id);
			}
			const updatedContent = {...this.content, description: newDescription};
			this.content = await this.apiClient.updateContent({
				id: this.id,
				body: updatedContent,
			});
			this.dispatchEditDescriptionEvent(newDescription);
		}
	}

	openEditDescriptionDialog() {
		if (this.description === 'undefined') {
			this.description = '';
			this.confirmEditDescriptionDisabled = true;
		}
		return async() => {
			const action = await this.shadowRoot.querySelector('#edit-description-dialog').open();
			const descriptionInputElement = this.shadowRoot.querySelector('#edit-description-input');
			if (action === dialogConfirmAction && descriptionInputElement && descriptionInputElement.value) {
				await this.editDescription(descriptionInputElement.value);
			} else {
				descriptionInputElement.value = this.description;
			}
		};
	}

	openRenameDialog() {
		return async() => {
			const action = await this.shadowRoot.querySelector('#rename-dialog').open();
			const titleInputElement = this.shadowRoot.querySelector('#rename-input');
			if (action === dialogConfirmAction && titleInputElement && titleInputElement.value) {
				await this.rename(titleInputElement.value);
			} else {
				titleInputElement.value = this.title;
			}
		};
	}

	openTransferOwnershipDialog() {
		return () => {
			this.shadowRoot.querySelector('#transfer-ownership').open();
		};
	}

	async rename(newTitle) {
		if (this.title !== newTitle) {
			if (!this.content) {
				this.content = await this.apiClient.getContent(this.id);
			}
			const updatedContent = {...this.content, title: newTitle};
			this.content = await this.apiClient.updateContent({
				id: this.id,
				body: updatedContent,
			});
			this.dispatchRenameEvent(newTitle);
		}
	}

	titleInputChangedHandler(event) {
		const titleInputValue = event.target.value;
		this.confirmRenameDisabled = !titleInputValue || titleInputValue.trim().length === 0;
	}

	async transferOwnershipHandler(e) {
		const { detail } = e;
		if (!detail) {
			return;
		}

		const { userId } = detail;
		if (this.ownerId !== userId) {
			if (!this.content) {
				this.content = await this.apiClient.getContent(this.id);
			}
			const updatedContent = {...this.content, ...{
				ownerId: userId,
				tenantIdOwnerId: `${this.content.tenantId}_${userId}`
			}};
			this.content = await this.apiClient.updateContent({
				id: this.id,
				body: updatedContent,
			});
			this.dispatchTransferOwnershipEvent(detail);
		}
	}
}

window.customElements.define('content-list-item', ContentListItem);
