import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';

import { css, html } from 'lit-element/lit-element.js';
import { autorun } from 'mobx';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { heading3Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { PageViewElement } from '../../components/page-view-element';

class D2LCaptureCentralCourseVideoPlayer extends DependencyRequester(PageViewElement) {
	static get properties() {
		return {
			_content: { type: Object },
			_loading: { type: Boolean },
			_navigationInfo: { type: Object },
			_sourceUrl: { type: String },
		};
	}

	static get styles() {
		return [heading3Styles, navigationSharedStyle, css`
			d2l-loading-spinner {
				display: flex;
				margin: auto;
				margin-top: 200px;
			}

			.d2l-heading-3 {
				margin-top: 0;
			}
			d2l-breadcrumbs {
				margin: 25px 0;
			}
		`];
	}

	constructor() {
		super();
		this.apiClient = this.requestDependency('content-service-client');
		this._content = {};
	}

	async connectedCallback() {
		super.connectedCallback();
		autorun(async() => {
			if (this.rootStore.routingStore.page === 'course-videos'
				&& this.rootStore.routingStore.subView
			) {
				this._updateBreadcrumbs();
				this._loading = true;
				this._content = await this.apiClient.getContent(this.rootStore.routingStore.subView);
				this._sourceUrl = (await this.apiClient.getSignedUrl(this.rootStore.routingStore.subView)).value;
				this._loading = false;
			}
		});
	}

	_updateBreadcrumbs() {
		const { previousPage, previousSubView } = this.rootStore.routingStore;
		let langterm = 'courseVideos';
		let previousLocation = '/course-videos';
		if (previousPage === 'presentations') {
			if (previousSubView === 'edit') {
				langterm = 'editPresentation';
				previousLocation = `/presentations/edit/${this.rootStore.routingStore.params.id}`;
			} else {
				langterm = 'managePresentations';
				previousLocation = '/presentations';
			}
		}
		this._navigationInfo = { langterm, previousLocation };
	}

	_renderMediaPlayer() {
		if (this._loading) {
			return html`<d2l-loading-spinner size=150></d2l-loading-spinner>`;
		}
		return html`
			<h3 class="d2l-heading-3">${this._content.title}</h3>
			<d2l-labs-media-player src="${this._sourceUrl}"></d2l-labs-media-player>
		`;
	}

	render() {
		const { langterm, previousLocation } = this._navigationInfo;
		return html`
			<div class="d2l-navigation-gutters">
				<d2l-breadcrumbs>
					<d2l-breadcrumb
						@click=${this._goTo('/admin')}
						href="#"
						text="${this.localize('captureCentral')}"
					></d2l-breadcrumb>
					<d2l-breadcrumb
						@click=${this._goTo(previousLocation)}
						href="#"
						text="${this.localize(langterm)}"
					></d2l-breadcrumb>
				</d2l-breadcrumbs>

				${this._renderMediaPlayer()}
			</div>
		`;
	}

}
customElements.define('d2l-capture-central-course-video-player', D2LCaptureCentralCourseVideoPlayer);
