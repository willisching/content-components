import { css, html, LitElement } from 'lit-element/lit-element.js';
import {
	bodyCompactStyles,
	bodySmallStyles
} from '@brightspace-ui/core/components/typography/styles.js';

// Polyfills
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/dropdown/dropdown-more.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import './content-list-columns.js';
import '../content-icon.js';

import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { useNewWindowForDownload } from '../../util/content-type.js';
import { rootStore } from '../../state/root-store.js';

const actionsDefaultZIndex = 2;
const actionsActiveZIndex = 5;

class ContentListItem extends DependencyRequester(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			id: { type: String },
			revisionId: { type: String, attribute: 'revision-id' },
			type: { type: String },
			disabled: { type: Boolean },
			selectable: { type: Boolean },
			dropdownBoundary: { type: Object, attribute: false }
		};
	}

	static get styles() {
		return [bodyCompactStyles, bodySmallStyles, css`
			.actions {
				position: relative;
			}
		`];
	}

	constructor() {
		super();
		this.selectable = true;
		this.dropdownBoundary = {};
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
		return html`
		<d2l-list separators="all">
			<d2l-list-item class="d2l-body-compact"
				?disabled=${this.disabled}
				?selectable=${this.selectable}
			>
				<div slot="illustration">
					<slot name="icon"></slot>
				</div>

				<content-list-columns>
					<div slot="detail">
						<slot name="title"></slot>
						<slot name="type" class="d2l-body-small"></slot>
					</div>
					<div slot="date">
						<slot name="date"></slot>
					</div>
				</content-list-columns>

				<div slot="actions" id="actions" class="actions">
					<d2l-button-icon
						@click=${this.openPreview()}
						text="${this.localize('preview')}"
						icon="tier1:preview"
						?disabled=${this.disabled}
					></d2l-button-icon>
					<d2l-dropdown-more text="${this.localize('moreActions')}" @click=${this.dropdownClicked}>
						<d2l-dropdown-menu id="actions-dropdown-menu" align="end" boundary=${JSON.stringify(this.dropdownBoundary)}>
							<d2l-menu label="${this.localize('moreActions')}">
								<d2l-menu-item text="${this.localize('download')}" @click="${this.download()}"></d2l-menu-item>
							</d2l-menu>
						</d2l-dropdown-menu>
					</d2l-dropdown-more>
				</div>
			</d2l-list-item>
		</d2l-list>
		`;
	}

	openPreview() {
		return async() => {
			const previewWindow = window.open('', '_blank');
			const { previewUrl } = await this.apiClient.getPreviewUrl({
				contentId: this.id,
				revisionId: this.revisionId
			});
			previewWindow.location.href = previewUrl;
		};
	}

	download() {
		return async() => {
			const res = await this.apiClient.getSignedUrlForRevision({
				contentId: this.id,
				revisionId: this.revisionId
			});
			const downloadWindow = useNewWindowForDownload(this.type) ?
				window.open('', '_blank') :
				window;

			downloadWindow.location.replace(res.value);
		};
	}

	// The class "actions" and methods dropdownClicked and dropdownClosed
	// are used to work around an issue with dropdown menus inside a list item: https://github.com/BrightspaceUI/core/issues/399
	dropdownClicked(e) {
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
}

window.customElements.define('content-list-item', ContentListItem);
