import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import '@brightspace-ui/core/components/loading-spinner/loading-spinner.js';

import { css, html } from 'lit-element/lit-element.js';
import { autorun } from 'mobx';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { PageViewElement } from '../../components/page-view-element';

class D2LCaptureCentralCourseVideoPlayer extends DependencyRequester(PageViewElement) {
	static get properties() {
		return {
			_content: { type: String },
			_sourceUrl: { type: String },
			_loading: { type: Boolean }
		};
	}

	static get styles() {
		return css`
			d2l-loading-spinner {
				display: flex;
				margin-top: 100px;
			}
			d2l-breadcrumbs {
				margin: 25px 0;
			}
		`;
	}

	constructor() {
		super();
		this.apiClient = this.requestDependency('content-service-client');
	}

	async connectedCallback() {
		super.connectedCallback();
		autorun(async() => {
			if (this.rootStore.routingStore.page === 'course-videos' && this.rootStore.routingStore.subView) {
				this._loading = true;
				this._sourceUrl = (await this.apiClient.getSignedUrl(this.rootStore.routingStore.subView)).value;
				this._content = await this.apiClient.getContent(this.rootStore.routingStore.subView);
				this._loading = false;
			}
		});
	}

	_renderMediaPlayer() {

		return html`
			<d2l-breadcrumbs>
				<d2l-breadcrumb
					@click=${this._goTo('/course-videos')}
					href=""
					text="${this.localize('courseVideos')}"
				></d2l-breadcrumb>
				<d2l-breadcrumb-current-page
					text="${this._content.title}"
				></d2l-breadcrumb-current-page>
			</d2l-breadcrumbs>
			<d2l-labs-media-player src="${this._sourceUrl}"></d2l-labs-media-player>
		`;
	}

	render() {
		if (this._loading) {
			return html`<d2l-loading-spinner size=150></d2l-loading-spinner>`;
		}

		return this._renderMediaPlayer();
	}

}
customElements.define('d2l-capture-central-course-video-player', D2LCaptureCentralCourseVideoPlayer);
