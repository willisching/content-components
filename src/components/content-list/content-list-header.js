import { css, html, LitElement } from 'lit-element/lit-element.js';
import { labelStyles } from '@brightspace-ui/core/components/typography/styles.js';

// Polyfills
import '@brightspace-ui/core/components/list/list.js';
import '@brightspace-ui/core/components/list/list-item.js';
import './content-list-columns.js';
import '../content-icon.js';

import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';

class ContentListHeader extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			loading: { type: Boolean, attribute: false }
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

			content-icon {
				height: 0;
				padding-left: 42px; /* total width of checkbox column */
			}

			d2l-list [slot=actions] {
				height: 0;
				width: 90px;
			}
		`];
	}

	constructor() {
		super();
		this.loading = false;
	}

	render() {
		return html`
		<d2l-list separators="none">
			<d2l-list-item class="d2l-label-text">
				<content-icon type="" slot="illustration"></content-icon>
				<content-list-columns>
					<div slot="detail" @click=${this.toggleSort('detail')}>${this.localize('name')}</div>
					<div slot="date" @click=${this.toggleSort('date')}>${this.localize('created')}</div>
				</content-list-columns>
				<div slot="actions"></div>
			</d2l-list-item>
		</d2l-list>
		`;
	}

	toggleSort(column) {
		return async() => {
			console.log('clicked', column);
		};
	}
}

window.customElements.define('content-list-header', ContentListHeader);
