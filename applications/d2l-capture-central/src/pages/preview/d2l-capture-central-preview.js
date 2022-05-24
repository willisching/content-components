import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import '@brightspace-ui/core/components/alert/alert-toast.js';
import { css, html } from 'lit-element/lit-element.js';

import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { PageViewElement } from '../../components/page-view-element';
import '../../../../../core/d2l-content-renderer.js';

class D2LCaptureCentralPreview extends DependencyRequester(PageViewElement) {
	static get properties() {
		return {
			contentId: { type: String, attribute: true },
			loading: {type: Boolean, attribute: false},
		};
	}

	static get styles() {
		return [navigationSharedStyle, css`
			d2l-loading-spinner {
				display: flex;
				margin-top: 20%;
			}
		`];
	}

	constructor() {
		super();
		this.loading = true;
	}

	async firstUpdated() {
		super.firstUpdated();

		this.loading = true;

		if (!this.contentId) {
			console.warn('Missing contentId', this);
			return;
		}

		this.contentServiceEndpoint = this.requestDependency('content-service-endpoint');
		this.tenantId = this.requestDependency('tenant-id');

		this.loading = false;
	}

	render() {
		if (this.loading) {
			return html`<d2l-loading-spinner size=150></d2l-loading-spinner>`;
		}

		return html`
		<d2l-content-renderer
			content-service-endpoint=${this.contentServiceEndpoint}
			tenant-id=${this.tenantId}
			content-id=${this.contentId}
		></d2l-content-renderer>`;
	}
}
customElements.define('d2l-capture-central-preview', D2LCaptureCentralPreview);
