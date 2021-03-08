import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import '../../components/ghost-box.js';

import { css, html } from 'lit-element/lit-element.js';
import { autorun } from 'mobx';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { heading3Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { pageNames } from '../../util/constants.js';
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
			.d2l-heading-3 {
				margin-top: 0;
			}
			d2l-breadcrumbs {
				margin: 25px 0;
			}

			.d2l-capture-central-course-video-player-breadcrumb-ghost {
				margin: 25px 0;
				height: 25px;
				width: 100px;
				min-width: 500px;
			}

			.d2l-capture-central-course-video-player-title-ghost {
				height: 25px;
				width: 250px;
			}

			.d2l-capture-central-course-video-player-video-ghost {
				margin-top: 25px;
				height: 600px;
				width: 100%;
			}
		`];
	}

	constructor() {
		super();
		this._content = {};
	}

	async connectedCallback() {
		super.connectedCallback();
		this.apiClient = this.requestDependency('content-service-client');
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
		const { previousPage } = this.rootStore.routingStore;
		let langterm = 'courseVideos';
		let previousLocation = '/course-videos';
		if (previousPage === 'my-videos') {
			langterm = 'myVideos';
			previousLocation = `/${pageNames.myVideos}`;
		}
		this._navigationInfo = { langterm, previousLocation };
	}

	render() {
		if (this._loading) {
			return html`
				<ghost-box class="d2l-capture-central-course-video-player-breadcrumb-ghost"></ghost-box>
				<ghost-box class="d2l-capture-central-course-video-player-title-ghost"></ghost-box>
				<ghost-box class="d2l-capture-central-course-video-player-video-ghost"></ghost-box>
			`;
		}

		const { langterm, previousLocation } = this._navigationInfo;
		return html`
			<d2l-breadcrumbs>
				<d2l-breadcrumb
					@click=${this._goTo(previousLocation)}
					href="#"
					text="${this.localize(langterm)}"
				></d2l-breadcrumb>
			</d2l-breadcrumbs>
			<h3 class="d2l-heading-3">${this._content.title}</h3>
			<d2l-labs-media-player src="${this._sourceUrl}"></d2l-labs-media-player>
		`;
	}

}
customElements.define('d2l-capture-central-course-video-player', D2LCaptureCentralCourseVideoPlayer);
