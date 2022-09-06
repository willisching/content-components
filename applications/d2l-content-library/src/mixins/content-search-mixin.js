import { formatDate } from '@brightspace-ui/intl/lib/dateTime.js';

import { dateFilterToSearchQuery } from '../util/date-filter.js';
import { getTimeZoneOrTimeZoneOffset } from '../util/date-time.js';

const contentTypes = ['Audio', 'Video'];
const clientApps = ['LmsContent', 'LmsCourseImport', 'LmsCapture', 'Capture', 'VideoNote', 'none'];

export const contentSearchMixin = superClass => class extends superClass {
	static get properties() {
		return {
			_moreResultsAvailable: { type: Boolean },
			_query: { type: String },
			_resultSize: { type: Number },
			_start: { type: Number },
			_totalResults: { type: Number },
			_files: { type: Array },
			_userCache: { type: Object }
		};
	}

	constructor() {
		super();
		this._moreResultsAvailable = false;
		this._query = '';
		this._resultSize = 15;
		this._start = 0;
		this._files = [];
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
				const { DisplayName } = await this.userBrightspaceClient.getUser({ userId });
				this._userCache[userId] = DisplayName || userId;
			} catch (error) {
				this._userCache[userId] = userId;
			}
		}

		return this._userCache[userId];
	}

	async _handleDeletedFileSearch({
		append = false,
		query = this._query,
		createdAt,
		sort = '',
		updatedAt
	} = {}) {
		if (append) {
			this._start += this._resultSize;
		}

		const { hits: { hits, total } } = await this.apiClient.search.searchContent({
			contentType: contentTypes.join(','),
			clientApps: clientApps.join(','),
			createdAt: dateFilterToSearchQuery(createdAt),
			filter: 'DELETED',
			includeProcessing: true,
			includeThumbnails: true,
			query: query,
			size: this._resultSize,
			sort: sort,
			start: this._start,
			timeZone: getTimeZoneOrTimeZoneOffset(),
			updatedAt: dateFilterToSearchQuery(updatedAt)
		});
		this._updateFileList(hits, append);
		this._totalResults = total;
		this._moreResultsAvailable = this._files.length < total;
	}

	async _handleFileSearch({
		append = false,
		query = this._query,
		createdAt,
		sort = '',
		updatedAt
	} = {}) {
		if (append) {
			this._start += this._resultSize;
		}

		const { hits: { hits, total } } = await this.apiClient.search.searchContent({
			contentType: contentTypes.join(','),
			clientApps: clientApps.join(','),
			createdAt: dateFilterToSearchQuery(createdAt),
			includeProcessing: true,
			includeThumbnails: true,
			query,
			size: this._resultSize,
			sort,
			start: this._start,
			timeZone: getTimeZoneOrTimeZoneOffset(),
			updatedAt: dateFilterToSearchQuery(updatedAt)
		});
		if (this.canTransferOwnership && this.userBrightspaceClient) {
			await this._addDisplayNames(hits);
		}
		this._updateFileList(hits, append);
		this._totalResults = total;
		this._moreResultsAvailable = this._files.length < total;
	}

	async _handleInputFileSearch({ detail: { value: query } }) {
		this._start = 0;
		this._query = query;
		await this._handleFileSearch();
	}

	async _handleLoadMoreFiles() {
		await this._handleFileSearch({ append: true });
	}

	async _handlePaginationSearch(page) {
		this._start = (page - 1) * this._resultSize;
		await this._handleFileSearch();
	}

	_updateFileList(hits, append = false) {
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
				poster: result.thumbnail,
				processingStatus: result.processingStatus,
				title: result.title || result.lastRevTitle,
				type: result.lastRevType,
				updatedAt: result.updatedAt,
				uploadDate: formatDate(new Date(result.createdAt)),
				views: getRandomInt(0, 100000)
			};
		});
		this._files = append ? this._files.concat(results) : results;
	}
};
