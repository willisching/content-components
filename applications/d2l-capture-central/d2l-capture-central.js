import { css, html, LitElement } from 'lit-element/lit-element.js';
import { CaptureApiClient, BrightspaceApiClient, ContentServiceApiClient } from '@d2l/content-service-shared-utils';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';

import { bodyStandardStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { DependencyProvider } from './src/mixins/dependency-provider-mixin.js';
import { rootStore } from './src/state/root-store.js';
import { Uploader } from './src/state/uploader.js';

class D2lCaptureCentral extends DependencyProvider(LitElement) {
	static get properties() {
		return {
			apiEndpoint: { type: String, attribute: 'content-service-endpoint' },
			canManageAllVideos: { type: Boolean, attribute: 'can-manage-all-videos' },
			canTransferOwnership: { type: Boolean, attribute: 'can-transfer-ownership' },
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			captureServiceEndpoint: { type: String, attribute: 'capture-service-endpoint' },
			tenantId: { type: String, attribute: 'tenant-id' },
			canRecord: { type: Boolean, attribute: 'can-record' },
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
		import('./src/d2l-capture-central-app.js');
	}

	firstUpdated() {
		super.firstUpdated();

		this.provideDependency('content-service-endpoint', this.contentServiceEndpoint);
		this.provideDependency('tenant-id', this.tenantId);
		this.provideDependency('can-record', this.canRecord);
		this.provideDependency('video-recording-duration-limit', this.videoRecordingDurationLimit);
		this.provideDependency('audio-recording-duration-limit', this.audioRecordingDurationLimit);
		this.provideDependency('auto-captions-enabled', this.autoCaptionsEnabled);

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
