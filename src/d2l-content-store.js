import { css, html, LitElement } from 'lit-element/lit-element.js';
import { DependencyProvider } from './mixins/dependency-provider-mixin.js';
import ContentServiceClient from './util/content-service-client.js';

class D2lContentStore extends DependencyProvider(LitElement) {
	static get properties() {
		return {
			apiEndpoint: { type: String, attribute: 'api-endpoint' }
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

		// eslint-disable-next-line no-unused-expressions
		import('./d2l-content-store-app.js');
	}

	firstUpdated() {
		super.firstUpdated();

		const apiClient = new ContentServiceClient(this.apiEndpoint);
		this.provideDependency('content-service-client', apiClient);
	}

	render() {
		return html`<d2l-content-store-app></d2l-content-store-app>`;
	}
}

customElements.define('d2l-content-store', D2lContentStore);
