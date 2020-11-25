import '@brightspace-ui/core/components/button/button-icon.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/card/card.js';
import '@brightspace-ui/core/components/dialog/dialog.js';
import '@brightspace-ui/core/components/dropdown/dropdown-button.js';
import '@brightspace-ui/core/components/dropdown/dropdown-menu.js';
import '@brightspace-ui/core/components/icons/icon.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui/core/components/menu/menu-item.js';
import '@brightspace-ui/core/components/menu/menu.js';
import '../../components/add-videos-dialog.js';
import '../../components/ghost-box.js';

import { css, html } from 'lit-element/lit-element.js';
import { autorun } from 'mobx';
import { contentSearchMixin } from '../../mixins/content-search-mixin';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { navigationSharedStyle } from '../../style/d2l-navigation-shared-styles.js';
import { PageViewElement } from '../../components/page-view-element';
class D2LCaptureCentralCourseVideos extends contentSearchMixin(DependencyRequester(PageViewElement)) {
	static get properties() {
		return {
			_loading: { type: Boolean, attribute: false }
		};
	}
	static get styles() {
		return [navigationSharedStyle, css`
			.d2l-capture-central-course-videos {
				display: grid;
				grid-gap: 50px 25px;
				grid-template-columns: repeat(3, 1fr);
				justify-content: center;
			}

			.d2l-capture-central-course-videos-header {
				align-self: center;
				grid-column: 1 / 2;
			}
			.d2l-capture-central-filter-folders {
				align-self: center;
				grid-column: 2 / 3;
				justify-self: end;
			}
			.d2l-capture-central-search-videos {
				align-self: center;
				grid-column: 3 / 4;
				justify-self: end;
				width: 100%;
			}

			.d2l-capture-central-video-no-results {
				grid-column: 1 / 4;
				grid-row: 3;
				justify-self: center;
			}

			.d2l-capture-central-course-videos-ghost-video[hidden] {
				display: none;
			}

			.d2l-capture-central-course-videos-ghost-video,
			.d2l-capture-central-video {
				display: flex;
				flex-direction: column;
				height: 300px;
				width: 375px;
			}
			.d2l-capture-central-thumbnail {
				height: 180px;
				object-fit: cover;
				width: 375px;
			}

			.d2l-capture-central-play-icon-overlay {
				background: rgb(0, 0, 0);
				background: rgba(0, 0, 0, 0.5); /* Black see-through */
				border-top-left-radius: 5px;
				border-top-right-radius: 5px;
				border: 1px transparent;
				display: flex;
				height: 180px;
				opacity: 0;
				padding: 0;
				position: absolute;
				top: 0;
				transition: .5s ease;
				width: 100%;
			}
			d2l-card:hover .d2l-capture-central-play-icon-overlay {
				opacity: 1;
			}
			.d2l-capture-central-play-icon {
				align-self: center;
				color: white;
				height: 40px;
				margin-left: auto;
				margin-right: auto;
				width: 40px;
			}

			.d2l-capture-central-video-info {
				margin-top: -25px;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.d2l-capture-central-upload-date, .d2l-capture-central-views {
				display: inline-block;
			}
			.d2l-capture-central-card-footer {
				margin-top: -25px;
				border-top: 1px solid var(--d2l-color-mica);
				display: flex;
				font-size: 14px;
				justify-content: space-between;
			}

			.d2l-capture-central-load-more-button {
				align-self: center;
				justify-self: center;
				margin-bottom: 50px;
				margin-top: 50px;
			}

			@media (max-width: 1200px) {
				.d2l-capture-central-course-videos {
					grid-gap: 25px 15px;
				}

				.d2l-capture-central-course-videos-ghost-video,
				.d2l-capture-central-video {
					min-width: 225px;
					width: 100%;
				}
				.d2l-capture-central-thumbnail {
					min-width: 225px;
					width: 100%;
				}
			}

			@media (max-width: 768px) {
				.d2l-capture-central-course-videos {
					grid-template-columns: repeat(2, 1fr);
					grid-gap: 15px 10px;
				}

				.d2l-capture-central-search-videos {
					grid-row: 1;
					grid-column: 2 / 3;
					width: 75%;
				}

				.d2l-capture-central-filter-folders {
					grid-row: 2;
					grid-column: 1 / 3;
					margin-left: auto;
				}

				.d2l-capture-central-video-no-results {
					grid-column: 1 / 3;
					grid-row: 4;
				}

				.d2l-capture-central-course-videos-ghost-video,
				.d2l-capture-central-video {
					height: 270px;
				}
				.d2l-capture-central-thumbnail,
				.d2l-capture-central-play-icon-overlay {
					height: 170px;
				}
			}

			@media (max-width: 520px) {
				.d2l-capture-central-course-videos {
					grid-template-columns: 1fr;
					grid-gap: 0px 15x;
				}

				.d2l-capture-central-search-videos {
					grid-column: 1 / 2;
					grid-row: 2;
					width: 100%;
				}

				.d2l-capture-central-filter-folders {
					grid-column: 1 / 2;
					grid-row: 3;
					margin-left: 0;
				}

				.d2l-capture-central-video-no-results {
					grid-column: 1 / 2;
					grid-row: 4;
				}

				.d2l-capture-central-course-videos-ghost-video,
				.d2l-capture-central-video {
					height: 300px;
					width: 100%;
				}
				.d2l-capture-central-thumbnail,
				.d2l-capture-central-play-icon-overlay {
					height: 180px;
				}
			}
		`];
	}

	constructor() {
		super();
		this.apiClient = this.requestDependency('content-service-client');
		this._loading = true;
	}

	async connectedCallback() {
		super.connectedCallback();
		autorun(async() => {
			if (this.rootStore.routingStore.page === 'course-videos'
				&& !this.rootStore.routingStore.subView
			) {
				await this._handleVideoSearched();
			}
		});
	}

	async _handleVideoSearched(event) {
		this._loading = true;
		if (event) {
			await this._handleInputVideoSearch(event);
		} else {
			await this._handleVideoSearch();
		}
		this._loading = false;
	}

	async _handleLoadMoreVideosClicked() {
		this._loading = true;
		await this._handleLoadMoreVideos();
		this._loading = false;
	}

	_renderGhosts() {
		return new Array(6).fill().map(() => html`
			<ghost-box
				?hidden="${!this._loading}"
				class="d2l-capture-central-course-videos-ghost-video"
			></ghost-box>
		`);
	}

	_renderNoResults() {
		return html`
			<div class="d2l-capture-central-video-no-results">
				${this.localize('noResults')}
			</div>
		`;
	}

	_renderVideos() {
		if (!this._loading && this._videos.length === 0) {
			return this._renderNoResults();
		}

		return this._videos.map(video => html`
			<d2l-card @click=${this._goTo(`/course-videos/${video.id}`)} class="d2l-capture-central-video">
				<div slot="header">
					<img alt="" class="d2l-capture-central-thumbnail" src="${video.thumbnail}" />
					<div class="d2l-capture-central-play-icon-overlay">
						<d2l-icon class="d2l-capture-central-play-icon" icon="tier3:play"></d2l-icon>
					</div>
				</div>
				<div class="d2l-capture-central-video-info" slot="content">
					${video.title}
				</div>
				<div class="d2l-capture-central-card-footer" slot="footer">
					<div class="d2l-capture-central-upload-date">${video.uploadDate}</div>
					<div class="d2l-capture-central-views">${this.localize('numViews', { count: video.views })}</div>
				</div>
			</d2l-card>
		`);
	}

	render() {
		return html`
			<div class="d2l-capture-central-course-videos d2l-navigation-gutters">
				<h2 class="d2l-capture-central-course-videos-header">${this.localize('courseVideos')}</h2>
				<d2l-dropdown-button class="d2l-capture-central-filter-folders" text="${this.localize('folders')}">
					<d2l-dropdown-menu>
						<d2l-menu label="Folders">
							<d2l-menu-item @click=${this._goTo('/admin')} text="Placeholder text ..."></d2l-menu-item>
							<d2l-menu-item text="Placeholder text ..."></d2l-menu-item>
						</d2l-menu>
					</d2l-dropdown-menu>
				</d2l-dropdown-button>
				<d2l-input-search
					@d2l-input-search-searched=${this._handleVideoSearched}
					class="d2l-capture-central-search-videos"
					label="${this.localize('searchLabel')}"
					placeholder="${this.localize('searchPlaceholder')}"
				></d2l-input-search>
				${this._renderVideos()}
				${this._renderGhosts()}
			</div>
			<d2l-button
				?hidden="${this._loading || !this._moreResultsAvailable}"
				class="d2l-capture-central-load-more-button"
				@click=${this._handleLoadMoreVideosClicked}
			>${this.localize('loadMore')}
			</d2l-button>
		`;
	}
}
customElements.define('d2l-capture-central-course-videos', D2LCaptureCentralCourseVideos);
