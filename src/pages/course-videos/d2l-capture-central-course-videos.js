import '@brightspace-ui-labs/pagination/pagination.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb-current-page.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumb.js';
import '@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js';
import '@brightspace-ui/core/components/button/button.js';
import '@brightspace-ui/core/components/colors/colors.js';
import '@brightspace-ui/core/components/inputs/input-search.js';
import '@brightspace-ui/core/components/list/list-item.js';
import '@brightspace-ui/core/components/list/list.js';

import './d2l-capture-central-add-videos-dialog.js';

import { bodyCompactStyles, heading3Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { css, html } from 'lit-element/lit-element.js';
import { sharedManageStyles, sharedTableStyles } from '../../components/shared-styles.js';
import { d2lTableStyles } from '../../components/d2l-table-styles.js';
import { DependencyRequester } from '../../mixins/dependency-requester-mixin.js';
import { formatDate } from '@brightspace-ui/intl/lib/dateTime.js';
import { PageViewElement } from '../../components/page-view-element.js';
import { sharedCourseVideoStyles } from './d2l-capture-central-course-videos-shared-styles.js';

class D2lCaptureCourseVideos extends DependencyRequester(PageViewElement) {

	static get properties() {
		return {
			_numSelectedVideos: { type: Number },
			_selectedVideos: { type: Array },
			_videos: { type: Array }
		};
	}
	static get styles() {
		return [ d2lTableStyles, bodyCompactStyles, heading3Styles, sharedManageStyles, sharedTableStyles, sharedCourseVideoStyles, css`
			.d2l-capture-central-video-list {
				margin-top: 20px;
			}

			.d2l-capture-central-manage-num-selected {
				align-content: center;
				display: flex;
				justify-content: space-between;
			}
		`];
	}

	constructor() {
		super();
		this._numSelectedVideos = 0;
		this._videos = [];
		this._selectedVideos = [];
		this.apiClient = this.requestDependency('content-service-client');
	}

	async connectedCallback() {
		super.connectedCallback();
		const { hits: { hits } } = await this.apiClient.searchContent({
			contentType: 'video',
			includeThumbnails: true
		});
		this._updateVideoList(hits);
	}

	async firstUpdated() {
		super.firstUpdated();
		this.shadowRoot
			.querySelector('#d2l-capture-central-add-from-content-store-button')
			.addEventListener('click', () => {
				this.shadowRoot
					.querySelector('d2l-capture-central-add-videos-dialog')
					.open();
			});
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

	_addToSelection({ detail: { selected, key } }) {
		this._numSelectedVideos += selected ? 1 : -1;
		if (selected) {
			this._selectedVideos.push(key);
		} else {
			this._selectedVideos = this._selectedVideos.filter(e => e !== key);
		}
		console.log(this._numSelectedVideos, this._selectedVideos);
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
			<div class="d2l-capture-central-manage-container">
				<d2l-breadcrumbs>
					<d2l-breadcrumb @click=${this._goTo('/admin')} href="#" text="${this.localize('captureCentral')}"></d2l-breadcrumb>
					<d2l-breadcrumb-current-page text="${this.localize('courseVideos')}"></d2l-breadcrumb-current-page>
				</d2l-breadcrumbs>
				<div class="d2l-capture-central-manage-num-selected">
					${this.localize('numPresentationsSelected', { count: this._numSelectedVideos })}
					<d2l-button
						id="d2l-capture-central-add-from-content-store-button"
						primary
					>${this.localize('addFromContentStore')}</d2l-button>
				</div>
				<div class="d2l-capture-central-manage-options">
					<d2l-button>${this.localize('remove')}</d2l-button>
					<d2l-input-search
						@d2l-input-search-searched=${this._handleVideoSearch}
						label="${this.localize('searchPresentations')}"
						placeholder="${this.localize('searchPresentations')}"
					></d2l-input-search>
				</div>
				<d2l-list
					@d2l-list-selection-change=${this._addToSelection}
					class="d2l-capture-central-video-list"
					separators="between"
				>${this._renderVideos()}
				</d2l-list>
				<d2l-labs-pagination page-number="1" max-page-number="5"></d2l-labs-pagination>
				<d2l-capture-central-add-videos-dialog></d2l-capture-central-add-videos-dialog>
			</div>
		`;
	}
}

window.customElements.define('d2l-capture-central-course-videos', D2lCaptureCourseVideos);
