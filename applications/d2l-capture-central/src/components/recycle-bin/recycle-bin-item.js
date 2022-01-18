import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/dropdown/dropdown-more.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import '@brightspace-ui/core/components/dialog/dialog.js';
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
			disabled: { type: Boolean },
			dropdownBoundary: { type: Object, attribute: false },
			id: { type: String },
			revisionId: { type: String, attribute: 'revision-id' },
			selectable: { type: Boolean },
			title: { type: String },
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
		`];
	}

	constructor() {
		super();
		this.selectable = false; // Hide checkboxes until bulk actions are implemented
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
	}

	render() {
		return html`
			<d2l-list-item class="d2l-body-compact"
				?disabled=${this.disabled}
				label="${this.title}"
				?selectable=${this.selectable}
				key=${this.id}
			>
				<div slot="illustration">
					<slot name="icon"></slot>
				</div>

				<recycle-bin-list-columns>
					<div slot="detail">
						<slot name="title"></slot>
						<slot name="type" class="d2l-body-small"></slot>
					</div>
					<div slot="date">
						<slot name="date"></slot>
						<slot name="expiry"></slot>
					</div>
				</recycle-bin-list-columns>

				<div slot="actions" id="actions" class="actions">
					<d2l-button
						class="d2l-capture-central-restore-button"
						@click="${this.restore}"
						type="button"
					>${this.localize('restore')}</d2l-button>
				</div>
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

	dispatchRestoreEvent() {
		this.dispatchEvent(new CustomEvent('recycle-bin-item-restored', {
			detail: {
				id: this.id
			}
		}));
	}

	restore() {
		this.dispatchRestoreEvent();
	}

	titleInputChangedHandler() {
		const titleInputElement = this.shadowRoot.querySelector('#rename-input');
		const titleInputValue = titleInputElement && titleInputElement.value;
		this.confirmDisabled = !titleInputValue || titleInputValue.trim().length === 0;
	}
}

window.customElements.define('recycle-bin-item', RecycleBinItem);
