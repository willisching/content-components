import { css, html, LitElement } from 'lit-element/lit-element.js';

class D2lContentStore extends LitElement {

	static get properties() {
		return {
			prop1: { type: String },
			token: {
				type: Object,
			},
			someStringAttribute: { type: String },
			someBooleanAttribute: { type: Boolean },
		};
	}

	static get styles() {
		return css`
			:host {
				display: inline-block;
			}
			:host([hidden]) {
				display: none;
			}
		`;
	}

	constructor() {
		super();

		this.prop1 = 'd2l-content-store';
		window.process = { env: { NODE_ENV: 'production' } };
		import('./d2l-content-store-app.js');
	}

	render() {
		return html`
			<p>hello world ${this.prop1}!!!</p>
			<d2l-content-store-app></d2l-content-store-app>
		`;
	}
}

customElements.define('d2l-content-store', D2lContentStore);
