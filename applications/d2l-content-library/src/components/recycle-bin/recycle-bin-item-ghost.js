import './recycle-bin-item.js';
import '../ghost-box.js';

import { css, html, LitElement } from 'lit-element/lit-element.js';

class RecycleBinItemGhost extends LitElement {
	static get properties() {
		return {
			selectable: { type: Boolean },
		};
	}

	static get styles() {
		return [css`
			.ghost [slot=icon] {
				width: 42px;
				height: 42px;
			}
			.ghost [slot=title] {
				width: 95%;
				height: 11px;
				margin: 8px 0 4px 0;
				max-width: 300px;
			}
			.ghost [slot=type] {
				width: 40%;
				height: 10px;
				margin: 8px 0 4px 0;
			}
			.ghost [slot=date] {
				height: 11px;
				max-width: 100px;
				width: 95%;
				margin: 8px 0 4px 0;
			}
		`];
	}

	render() {
		return html`
			<recycle-bin-item class="ghost" disabled ?selectable=${this.selectable}>
				<ghost-box slot="icon"></ghost-box>
				<ghost-box slot="title"></ghost-box>
				<ghost-box slot="type"></ghost-box>
				<ghost-box slot="date"></ghost-box>
			</recycle-bin-item>
		`;
	}
}

window.customElements.define('recycle-bin-item-ghost', RecycleBinItemGhost);
