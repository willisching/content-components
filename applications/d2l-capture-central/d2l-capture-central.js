import { css, html, LitElement } from 'lit-element/lit-element.js';
import { bodyStandardStyles } from '@brightspace-ui/core/components/typography/styles.js';
import CaptureServiceClient from './src/util/capture-service-client.js';
import ContentServiceClient from './src/util/content-service-client.js';
import { DependencyProvider } from './src/mixins/dependency-provider-mixin.js';
import { rootStore } from './src/state/root-store.js';
import { Uploader } from './src/state/uploader.js';
import UserBrightspaceClient from './src/util/user-brightspace-client.js';

class D2lCaptureCentral extends DependencyProvider(LitElement) {
	static get properties() {
		return {
			apiEndpoint: { type: String, attribute: 'content-service-endpoint' },
			canManageAllVideos: { type: Boolean, attribute: 'can-manage-all-videos' },
			canTransferOwnership: { type: Boolean, attribute: 'can-transfer-ownership' },
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			captureServiceEndpoint: { type: String, attribute: 'capture-service-endpoint' },
			tenantId: { type: String, attribute: 'tenant-id' }
		};
	}

	static get styles() {
		return [bodyStandardStyles, css`
			:host {
				display: inline-block;
				height: 100%;
				overflow: auto;
				width: 100%;
			}
			:host([hidden]) {
				display: none;
			}
		`];
	}

	constructor() {
		super();
		import('./src/d2l-capture-central-app.js');
	}

	firstUpdated() {
		super.firstUpdated();

		this.provideDependency('content-service-endpoint', this.contentServiceEndpoint);
		this.provideDependency('tenant-id', this.tenantId);

		const apiClient = new ContentServiceClient({
			endpoint: this.contentServiceEndpoint,
			tenantId: this.tenantId
		});
		this.provideDependency('content-service-client', apiClient);
		rootStore.uploader.apiClient = apiClient;
		const captureApiClient = new CaptureServiceClient({
			endpoint: this.captureServiceEndpoint
		});
		this.provideDependency('capture-service-client', captureApiClient);

		const userBrightspaceClient = new UserBrightspaceClient();
		this.provideDependency('user-brightspace-client', userBrightspaceClient);

		const uploader = new Uploader({
			apiClient
		});

		this.provideDependency('uploader', uploader);
	}

	render() {
		return html`
			<d2l-capture-central-app
				class="d2l-body-standard"
				?can-manage-all-videos="${this.canManageAllVideos}"
				?can-transfer-ownership="${this.canTransferOwnership}"
				tenant-id="${this.tenantId}"
			></d2l-capture-central-app>`;
	}
}

customElements.define('d2l-capture-central', D2lCaptureCentral);
