import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '../../../../../capture/d2l-capture-producer.js';

import { css, html } from 'lit-element/lit-element.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { pageNames } from '../../util/constants.js';
import { PageViewElement } from '../../components/page-view-element';

class D2LCaptureCentralProducer extends DependencyRequester(PageViewElement) {
	static get styles() {
		return [navigationSharedStyle, css`
			.d2l-capture-central-producer {
				width: 1170px;
				overflow: hidden;
			}

			d2l-breadcrumbs {
				margin: 25px 0;
			}

			d2l-loading-spinner {
				display: flex;
				margin: auto;
				margin-top: 200px;
			}
		`];
	}

	async connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
	}

	render() {
		if (this._loading) {
			return html`<d2l-loading-spinner size=150></d2l-loading-spinner>`;
		}

		return html`
			<div class="d2l-capture-central-producer">
				${this._renderBreadcrumbs()}

				${this.apiClient ? html`
					<d2l-capture-producer
						.endpoint="${this.apiClient.endpoint}"
						.tenantId="${this.apiClient.tenantId}"
						.contentId="${this.rootStore.routingStore.params.id}"
					></d2l-capture-producer>
				` : html`<d2l-loading-spinner size=150></d2l-loading-spinner>`}

			</div>
		`;
	}

	get producer() {
		return this.shadowRoot.querySelector('d2l-capture-producer');
	}

	_renderBreadcrumbs() {
		return html`
			<d2l-breadcrumbs>
				<d2l-breadcrumb
					@click=${this._goTo(`/${pageNames.myVideos}`)}
					href=""
					text="${this.localize('myVideos')}"
				></d2l-breadcrumb>
				<d2l-breadcrumb-current-page
					text="${this.producer?.content ? this.producer.content.title : ''}"
				></d2l-breadcrumb-current-page>
			</d2l-breadcrumbs>
		`;
	}
}
customElements.define('d2l-capture-central-producer', D2LCaptureCentralProducer);
