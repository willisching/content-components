import { css, html, LitElement } from 'lit-element/lit-element.js';
import { CaptureApiClient, BrightspaceApiClient, ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';

import { bodyStandardStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { DependencyProvider } from './src/mixins/dependency-provider-mixin.js';
import { rootStore } from './src/state/root-store.js';
import { Uploader } from './src/state/uploader.js';
import ContentType from '../../util/content-type.js';

class D2lContentLibrary extends DependencyProvider(LitElement) {
	static get properties() {
		return {
			apiEndpoint: { type: String, attribute: 'content-service-endpoint' },
			authServiceEndpoint: { type: String, attribute: 'auth-service-endpoint' },
			canManageAllObjects: { type: Boolean, attribute: 'can-manage-all-objects' },
			canTransferOwnership: { type: Boolean, attribute: 'can-transfer-ownership' },
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			captureServiceEndpoint: { type: String, attribute: 'capture-service-endpoint' },
			isMultipart: { type: Boolean, attribute: 'is-multipart' },
			tenantId: { type: String, attribute: 'tenant-id' },
			userId: { type: Number, attribute: 'user-id' },
			showAdvancedFilters: { type: Boolean, attribute: 'show-advanced-filters' },
			canRecord: { type: Boolean, attribute: 'can-record' },
			canAccessCapture: { type: Boolean, attribute: 'can-access-capture' },
			videoRecordingDurationLimit: { type: Number, attribute: 'video-recording-duration-limit' },
			audioRecordingDurationLimit: { type: Number, attribute: 'audio-recording-duration-limit' },
			autoCaptionsEnabled: { type: Boolean, attribute: 'auto-captions-enabled' }
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
		import('./src/d2l-content-library-app.js');
	}

	firstUpdated() {
		super.firstUpdated();

		this.provideDependency('content-service-endpoint', this.contentServiceEndpoint);
		this.provideDependency('tenant-id', this.tenantId);
		this.provideDependency('user-id', this.userId);
		this.provideDependency('show-advanced-filters', this.showAdvancedFilters);
		this.provideDependency('can-record', this.canRecord);
		this.provideDependency('can-access-capture', this.canAccessCapture);
		this.provideDependency('video-recording-duration-limit', this.videoRecordingDurationLimit);
		this.provideDependency('audio-recording-duration-limit', this.audioRecordingDurationLimit);
		this.provideDependency('auto-captions-enabled', this.autoCaptionsEnabled);
		this.provideDependency('supported-types', [ContentType.AUDIO, ContentType.VIDEO]);

		const apiClient = new ContentServiceApiClient({
			httpClient: new ContentServiceBrowserHttpClient({ serviceUrl: this.contentServiceEndpoint }),
			tenantId: this.tenantId
		});
		this.provideDependency('content-service-client', apiClient);
		rootStore.uploader.apiClient = apiClient;
		const captureApiClient = new CaptureApiClient({
			httpClient: new ContentServiceBrowserHttpClient({ serviceUrl: this.captureServiceEndpoint }),
		});
		this.provideDependency('capture-service-client', captureApiClient);

		const brightspaceClient = new BrightspaceApiClient({
			httpClient: new ContentServiceBrowserHttpClient()
		});
		this.provideDependency('user-brightspace-client', brightspaceClient);

		const uploader = new Uploader({
			apiClient,
			isMultipart: this.isMultipart
		});

		this.provideDependency('uploader', uploader);
	}

	render() {
		return html`
			<d2l-content-library-app
				auth-service-endpoint="${this.authServiceEndpoint}"
				class="d2l-body-standard"
				?can-manage-all-objects="${this.canManageAllObjects}"
				?can-transfer-ownership="${this.canTransferOwnership}"
				?can-access-capture="${this.canAccessCapture}"
				?is-multipart=${this.isMultipart}
				tenant-id="${this.tenantId}"
			></d2l-content-library-app>`;
	}
}

customElements.define('d2l-content-library', D2lContentLibrary);
