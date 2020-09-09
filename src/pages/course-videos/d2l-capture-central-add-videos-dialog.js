import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/dialog/dialog.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list.js';

import { bodyCompactStyles, heading3Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { asyncStates } from '@brightspace-ui/core/mixins/async-container/async-container-mixin.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { formatDate } from '@brightspace-ui/intl/lib/dateTime.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin.js';
import { sharedCourseVideoStyles } from './d2l-capture-central-course-videos-shared-styles.js';
import { sharedManageStyles } from '../../components/shared-styles.js';

class D2lCaptureAddVideosDialog extends DependencyRequester(InternalLocalizeMixin(RtlMixin(LitElement))) {

	static get properties() {
		return {
			_numSelectedVideos: { type: Number },
			_selectedVideos: { type: Array },
			_videos: { type: Array }
		};
	}
	static get styles() {
		return [ bodyCompactStyles, heading3Styles, sharedManageStyles, sharedCourseVideoStyles, css`
			.d2l-capture-central-video-list {
				height: 460px;
				overflow-y: scroll;
			}
			.d2l-capture-central-manage-options {
				align-items: center;
			}
			.d2l-capture-central-manage-options .d2l-capture-central-manage-num-selected {
				margin: 10px 0;
			}

			.d2l-capture-central-load-more-button {
				display: flex;
				margin: 10px 0;
				margin-left: auto;
				margin-right: auto;
				width: 250px;
			}
		`];
	}

	constructor() {
		super();
		this._numSelectedVideos = 0;
		this._videos = [];
		this._contentStoreVideos = [];
		this._selectedVideos = [];
	}

	async open() {
		this.shadowRoot.querySelector('d2l-dialog').open();
		this.apiClient = this.requestDependency('content-service-client');
		const { hits: { hits } } = await this.apiClient.searchContent({
			contentType: 'video',
			includeThumbnails: true
		});
		this.shadowRoot.querySelector('d2l-dialog').asyncState = asyncStates.complete;
		this._updateVideoList(hits);
	}

	_updateVideoList(hits) {
		function getRandomInt(min, max) {
			min = Math.ceil(min);
			max = Math.floor(max);
			return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
		}
		const content = hits.map(hit => hit._source);
		this._videos = content.map(({ thumbnail, lastRevTitle, createdAt }) => {
			const randomSeconds = getRandomInt(1, 60);
			return {
				thumbnail,
				title: lastRevTitle,
				duration: `${getRandomInt(0, 20)}:${randomSeconds < 10 ? '0' : ''}${randomSeconds}`,
				uploadDate: formatDate(new Date(createdAt)),
				views: getRandomInt(0, 100000)
			};
		});

	}

	async _handleVideoSearch({ detail: { value: query } }) {
		const { hits: { hits } } = await this.apiClient.searchContent({
			query,
			contentType: 'video',
			includeThumbnails: true
		});
		this._updateVideoList(hits);
	}

	async _addCourseVideos(event) {
		console.log(event);
	}

	_addToSelection({ detail: { selected, key } }) {
		this._numSelectedVideos += selected ? 1 : -1;
		if (selected) {
			this._selectedVideos.push(key);
		} else {
			this._selectedVideos = this._selectedVideos.filter(e => e !== key);
		}
		return;
	}

	_renderVideos() {
		if (this._videos.length === 0) {
			return html`<div>${this.localize('noResults')}</div>`;
		}
		return this._videos.map(({ thumbnail, title, uploadDate, duration, views }) => {
			return html`
				<d2l-list-item class="d2l-capture-central-video-list-item" selectable key="${views}">
					<div slot="illustration">
						<img alt="" class="d2l-capture-central-video-thumbnail" src="${thumbnail}" slot="illustration"></img>
						<div class="d2l-capture-central-video-thumbnail-duration-overlay">
							${duration}
						</div>
					</div>
					<d2l-list-item-content class="d2l-capture-central-video-list-content">
						<h3 class="d2l-heading-3">${title}</h3>
						<div class="d2l-body-compact">${uploadDate} - ${this.localize('numViews', { count: views })}</div>
					</d2l-list-item-content>
				</d2l-list-item>
			`;
		});
	}

	render() {
		return html`
			<d2l-dialog async title-text="${this.localize('addToCourseVideos')}" width="900">
				<div class="d2l-capture-central-manage-options">
					<div class="d2l-capture-central-manage-num-selected">
						${this.localize('numPresentationsSelected', { count: this._numSelectedVideos })}
					</div>
					<d2l-input-search
						@d2l-input-search-searched=${this._handleVideoSearch}
						label="${this.localize('searchCourseVideos')}"
						placeholder="${this.localize('searchCourseVideos')}"
					></d2l-input-search>
				</div>
				<d2l-list
					@d2l-list-selection-change=${this._addToSelection}
					class="d2l-capture-central-video-list"
					separators="between"
				>
					${this._renderVideos()}
					<d2l-button class="d2l-capture-central-load-more-button">
						${this.localize('loadMore')}
					</d2l-button>
				</d2l-list>
				<d2l-button
					slot="footer"
					@click=${this._addCourseVideos}
					primary data-dialog-action="${this._selectedVideos}"
				>${this.localize('add')}
				</d2l-button>
				<d2l-button slot="footer" data-dialog-action>${this.localize('cancel')}</d2l-button>
			</d2l-dialog>
		`;
	}
}

window.customElements.define('d2l-capture-central-add-videos-dialog', D2lCaptureAddVideosDialog);
