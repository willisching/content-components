import { formatDate } from '@brightspace-ui/intl/lib/dateTime.js';

export const contentSearchMixin = superClass => class extends superClass {
	static get properties() {
		return {
			_moreResultsAvailable: { type: Boolean },
			_query: { type: String },
			_start: { type: Number },
			_totalResults: { type: Number },
			_videos: { type: Array }
		};
	}

	constructor() {
		super();
		this._moreResultsAvailable = false;
		this._query = '';
		this._start = 0;
		this._videos = [];
		this._totalResults = 0;
	}

	_updateVideoList(hits, append = false) {
		function getRandomInt(min, max) {
			min = Math.ceil(min);
			max = Math.floor(max);
			return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
		}
		const content = hits.map(hit => hit._source);
		const results = content.map(({ id, thumbnail, lastRevTitle, createdAt }) => {
			const randomSeconds = getRandomInt(1, 60);
			return {
				id,
				thumbnail,
				title: lastRevTitle,
				duration: `${getRandomInt(0, 20)}:${randomSeconds < 10 ? '0' : ''}${randomSeconds}`,
				uploadDate: formatDate(new Date(createdAt)),
				views: getRandomInt(0, 100000)
			};
		});
		this._videos = append ? this._videos.concat(results) : results;
	}

	_handleInputVideoSearch({ detail: { value: query } }) {
		this._start = 0;
		this._query = query;
		this._handleVideoSearch();
	}

	async _handleLoadMoreVideos() {
		this._start += 20;
		await this._handleVideoSearch(true);
	}

	async _handlePaginationSearch(page) {
		this._start = (page - 1) * 20;
		await this._handleVideoSearch();
	}

	async _handleVideoSearch(append = false) {
		const { hits: { hits, total } } = await this.apiClient.searchContent({
			contentType: 'video',
			includeThumbnails: true,
			query: this._query,
			start: this._start
		});
		this._updateVideoList(hits, append);
		this._totalResults = total;
		this._moreResultsAvailable = this._videos.length < total;
	}
};
