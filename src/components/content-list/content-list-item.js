import { css, html, LitElement } from 'lit-element/lit-element.js';
import {
	bodyCompactStyles,
	bodySmallStyles
} from '@brightspace-ui/core/components/typography/styles.js';

// Polyfills
import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/list/list-item.js';
import './content-list-columns.js';
import '../content-icon.js';

import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';

class ContentListItem extends DependencyRequester(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			id: { type: String },
			revisionId: { type: String, attribute: 'revision-id' },
			disabled: { type: Boolean },
			selectable: { type: Boolean }
		};
	}

	static get styles() {
		return [bodyCompactStyles, bodySmallStyles, css``];
	}

	constructor() {
		super();
		this.selectable = true;
	}

	connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
	}

	render() {
		return html`
		<div separators="all">
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

				<div slot="actions">
					<d2l-button-icon
						@click=${this.openPreview()}
						text="${this.localize('preview')}"
						icon="tier1:preview"
						?disabled=${this.disabled}
					></d2l-button-icon>
					<d2l-button-icon
						text="${this.localize('more')}"
						icon="tier1:more"
						?disabled=${this.disabled}
					></d2l-button-icon>
				</div>
			</d2l-list-item>
		</div>
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
}

window.customElements.define('content-list-item', ContentListItem);
