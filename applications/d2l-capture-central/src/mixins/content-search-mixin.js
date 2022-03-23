import { formatDate } from '@brightspace-ui/intl/lib/dateTime.js';

const clientApps = ['LmsContent', 'LmsCourseImport', 'LmsCapture', 'Capture', 'none'];

export const contentSearchMixin = superClass => class extends superClass {
	static get properties() {
		return {
			_moreResultsAvailable: { type: Boolean },
			_query: { type: String },
			_resultSize: { type: Number },
			_start: { type: Number },
			_totalResults: { type: Number },
			_videos: { type: Array },
			_userCache: { type: Object }
		};
	}

	constructor() {
		super();
		this._moreResultsAvailable = false;
		this._query = '';
		this._resultSize = 15;
		this._start = 0;
		this._videos = [];
		this._totalResults = 0;
		this._userCache = {};
	}

	async _addDisplayNames(hits) {
		const results = hits.map(hit => hit._source);
		for (const result of results) {
			result.ownerDisplayName = await this._getDisplayName(result.ownerId);
		}
	}

	async _getDisplayName(userId) {
		if (!this._userCache[userId]) {
			try {
				const { DisplayName } = await this.userBrightspaceClient.getUser(userId);
				this._userCache[userId] = DisplayName || userId;
			} catch (error) {
				this._userCache[userId] = userId;
			}
		}

		return this._userCache[userId];
	}

	async _handleDeletedVideoSearch({
		append = false,
		query = this._query,
		createdAt,
		sort = '',
		updatedAt
	} = {}) {
		if (append) {
			this._start += this._resultSize;
		}

		const { hits: { hits, total } } = await this.apiClient.searchDeletedContent({
			contentType: 'video',
			clientApps: clientApps.join(','),
			createdAt: createdAt,
			includeThumbnails: true,
			query: query,
			sort: sort,
			start: this._start,
			updatedAt: updatedAt
		});
		this._updateVideoList(hits, append);
		this._totalResults = total;
		this._moreResultsAvailable = this._videos.length < total;
	}

	async _handleInputVideoSearch({ detail: { value: query } }) {
		this._start = 0;
		this._query = query;
		await this._handleVideoSearch();
	}

	async _handleLoadMoreVideos() {
		await this._handleVideoSearch({ append: true });
	}

	async _handlePaginationSearch(page) {
		this._start = (page - 1) * this._resultSize;
		await this._handleVideoSearch();
	}

	async _handleVideoSearch({
		append = false,
		query = this._query,
		createdAt,
		sort = '',
		updatedAt
	} = {}) {
		if (append) {
			this._start += this._resultSize;
		}

		const { hits: { hits, total } } = await this.apiClient.searchContent({
			contentType: 'video',
			clientApps: clientApps.join(','),
			createdAt,
			includeThumbnails: true,
			query,
			sort,
			start: this._start,
			updatedAt
		});
		if (this.canTransferOwnership && this.userBrightspaceClient) {
			await this._addDisplayNames(hits);
		}
		this._updateVideoList(hits, append);
		this._totalResults = total;
		this._moreResultsAvailable = this._videos.length < total;
	}

	_updateVideoList(hits, append = false) {
		function getRandomInt(min, max) {
			min = Math.ceil(min);
			max = Math.floor(max);
			return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
		}
		const content = hits.map(hit => hit._source);
		const results = content.map(result => {
			const randomSeconds = getRandomInt(1, 60);
			return {
				duration: `${getRandomInt(0, 20)}:${randomSeconds < 10 ? '0' : ''}${randomSeconds}`,
				id: result.id,
				description: result.lastRevDescription,
				revisionId: result.lastRevId,
				ownerId: result.ownerId,
				ownerDisplayName: result.ownerDisplayName,
				thumbnail: result.thumbnail,
				title: result.title || result.lastRevTitle,
				type: result.lastRevType,
				updatedAt: result.updatedAt,
				uploadDate: formatDate(new Date(result.createdAt)),
				views: getRandomInt(0, 100000)
			};
		});
		this._videos = append ? this._videos.concat(results) : results;
	}
};
