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
	static get properties() {
		return {
			_currentPageTitle: { type: String, attribute: false }
		};
	}

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

	constructor() {
		super();

		this._currentPageTitle = '';
	}

	async connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
	}

	render() {
		if (this._loading || !this.rootStore.routingStore.params.id) {
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
						@content-loaded="${this._handleContentLoaded}"
					></d2l-capture-producer>
				` : html`<d2l-loading-spinner size=150></d2l-loading-spinner>`}

			</div>
		`;
	}

	_handleContentLoaded(event) {
		this._currentPageTitle = event.detail.content.title;
	}

	_renderBreadcrumbs() {
		return html`
			<d2l-breadcrumbs>
				<d2l-breadcrumb
					@click=${this._goTo(`/${pageNames.videos}`)}
					href=""
					text="${this.localize('mediaLibrary')}"
				></d2l-breadcrumb>
				${this._currentPageTitle ? html`
					<d2l-breadcrumb-current-page
						text="${this._currentPageTitle}"
					></d2l-breadcrumb-current-page>
				` : ''}
			</d2l-breadcrumbs>
		`;
	}
}
customElements.define('d2l-capture-central-producer', D2LCaptureCentralProducer);
