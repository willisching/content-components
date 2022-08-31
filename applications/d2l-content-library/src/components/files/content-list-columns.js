import { css, html, LitElement } from 'lit-element/lit-element.js';

class ContentListColumns extends LitElement {
	static get styles() {
		return [css`
			:host {
				display: flex;
				flex-wrap: wrap;
				width: 100%;
			}

			.col {
				display: flex;
				flex-direction: column;
			}

			.col.detail {
				width: 50%;
			}

			.col.owner {
				width: 30%
			}

			.col.date {
				width: 20%;
			}
		`];
	}

	render() {
		return html`
			<div class="col detail"><slot name="detail"></slot></div>
			<div class="col owner"><slot name="owner"></slot></div>
			<div class="col date"><slot name="date"></slot></div>
		`;
	}
}

window.customElements.define('content-list-columns', ContentListColumns);
