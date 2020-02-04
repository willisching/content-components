import { css, html, LitElement } from 'lit-element/lit-element.js';
import appConfig from './app-config.js';

class D2lContentStore extends LitElement {
	static get properties() {
		return appConfig.properties;
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

		// Dynamically importing d2l-content-store-app
		// to avoid "process is not defined" error caused by importing
		// redux at the top level.
		window.process = { env: { NODE_ENV: 'production' } };

		// eslint-disable-next-line no-unused-expressions
		import('./d2l-content-store-app.js');
	}

	render() {
		return html`
		<d2l-content-store-app
			api-endpoint=${this.apiEndpoint}
			auth-token=${this.authToken}
		></d2l-content-store-app>
		`;
	}
}

customElements.define('d2l-content-store', D2lContentStore);
