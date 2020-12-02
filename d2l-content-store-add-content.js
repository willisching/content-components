import './src/pages/tabs-container.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import ContentServiceClient from './src/util/content-service-client';
import { DependencyProvider } from './src/mixins/dependency-provider-mixin';
import { Uploader } from './src/state/uploader';

class D2lContentStoreAddContent extends DependencyProvider(LitElement) {
	static get properties() {
		return {
			apiEndpoint: { type: String, attribute: 'api-endpoint', reflect: true },
			tenantId: { type: String, attribute: 'tenant-id', reflect: true }
		};
	}

	static get styles() {
		return css`
			:host {
				display: inline-block;
				width: 100%;
				margin-top: 5px;
			}
			:host([hidden]) {
				display: none;
			}
		`;
	}

	firstUpdated() {
		super.firstUpdated();

		const apiClient = new ContentServiceClient({
			endpoint: this.apiEndpoint,
			tenantId: this.tenantId
		});
		this.provideDependency('content-service-client', apiClient);

		const uploader = new Uploader({ apiClient });
		this.provideDependency('uploader', uploader);
	}

	render() {
		return html`
			<d2l-content-store-add-content-tabs-container></d2l-content-store-add-content-tabs-container>
		`;
	}
}
customElements.define('d2l-content-store-add-content', D2lContentStoreAddContent);
