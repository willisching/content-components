// Polyfills
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/list/list-item.js';
import './content-list-columns.js';
import '../column-header.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { labelStyles } from '@brightspace-ui/core/components/typography/styles.js';

class ContentListHeader extends InternalLocalizeMixin(LitElement) {
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
				padding-left: 42px; /* total width of checkbox column */
			}

			d2l-list [slot=actions] {
				height: 0;
				width: 90px;
			}
		`];
	}

	render() {
		return html`
		<d2l-list separators="none">
			<d2l-list-item class="d2l-label-text">
				<div class="d2l-icon-spacer" slot="illustration"></div>
				<content-list-columns>
					<column-header slot="detail" group="content-list">
						<column-header-choice
							label="${this.localize('name')}"
							sort-key="lastRevTitle.keyword"
						></column-header-choice>
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
				<div slot="actions"></div>
			</d2l-list-item>
		</d2l-list>
		`;
	}
}

window.customElements.define('content-list-header', ContentListHeader);
