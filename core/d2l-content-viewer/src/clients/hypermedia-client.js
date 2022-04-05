import SirenParse from 'siren-parser';
import * as querystring from '@chaitin/querystring';
import fetchAuthUnframed from 'd2l-fetch-auth/src/unframed/index.js';
import fetchAuthFramed from 'd2l-fetch-auth/es6/d2lfetch-auth-framed.js';
import { d2lfetch } from 'd2l-fetch/src/index.js';
import { ContentType, VideoFormat } from './enums.js';

export default class HypermediaClient {
	constructor({ entity, framed }) {
		this.entity = SirenParse(entity);
		this.framed = framed;
		this.d2lfetch = d2lfetch.addTemp({
			name: 'auth',
			fn: this.framed ? fetchAuthFramed : fetchAuthUnframed
		});
	}

	async getCaptions(resourceEntity) {
		if (!resourceEntity || !resourceEntity.hasActionByName('get-tracks')) {
			return null;
		}
		const getTracksAction = resourceEntity.getActionByName('get-tracks');
		const getTracksResponse = await this._fetch({ url: getTracksAction.href });
		const tracksEntity = SirenParse(getTracksResponse);
		const { tracks } = tracksEntity.properties;
		return tracks;
	}

	async getMedia(resourceEntity) {
		if (!resourceEntity || !resourceEntity.hasActionByName('get-media')) {
			return null;
		}

		const getMediaAction = resourceEntity.getActionByName('get-media');
		const formatField = getMediaAction.getFieldByName('format');
		const supportedFormats = formatField.value;
		if (supportedFormats.length > 0) {
			return Promise.all(supportedFormats.map(async format => {
				const result = await this._fetch({ url: `${getMediaAction.href}?format=${format.value}&attachment=false` });
				return {
					format: VideoFormat.get(format.value.toUpperCase()),
					src: result.properties.src,
					expires: result.properties.expires * 1000
				};
			}));
		}

		const result = await this._fetch({ url: `${getMediaAction.href}?attachment=false` });
		return [{
			src: result.properties.src,
			expires: result.properties.expires * 1000
		}];
	}

	async getMediaWithBestFormat({ resourceEntity, attachment = false }) {
		if (!resourceEntity || !resourceEntity.hasActionByName('get-media')) {
			return null;
		}

		const getMediaAction = resourceEntity.getActionByName('get-media');
		const formatField = getMediaAction.getFieldByName('format');
		const supportedFormats = formatField.value ? formatField.value.map(formatObject => formatObject.value && formatObject.value.toLowerCase()) : [];
		const formatsBestFirst = [VideoFormat.HD.key, VideoFormat.SD.key, VideoFormat.LD.key, VideoFormat.MP3.key];
		const bestFormat = formatsBestFirst.find(f => supportedFormats.includes(f.toLowerCase()));
		const result = await this._fetch({ url: `${getMediaAction.href}?format=${bestFormat}&attachment=${attachment}` });

		return {
			src: result.properties.src,
			expires: result.properties.expires * 1000
		};
	}

	async getMetadata(resourceEntity) {
		if (!resourceEntity || !resourceEntity.hasActionByName('get-metadata')) {
			return null;
		}

		try {
			const getMetadataAction = resourceEntity.getActionByName('get-metadata');
			const metadataResponse = await this._fetch({ url: getMetadataAction.href });
			const metadataEntity = SirenParse(metadataResponse);
			return metadataEntity.properties;
		} catch (e) {
			if (e.code !== 404) throw e;
			return null;
		}
	}

	async getResourceEntity() {
		if (!this.entity.hasLinkByClass('content-service-resource')) {
			return null;
		}

		const { href } = this.entity.getLinkByClass('content-service-resource');
		try {
			const resourceResponse = await this._fetch({ url: href });
			const resourceEntity = SirenParse(resourceResponse);
			return resourceEntity;
		} catch (e) {
			if (e.code === 404) {
				return null;
			}
			throw e;
		}
	}

	async getRevision(resourceEntity) {
		if (!resourceEntity || !resourceEntity.hasActionByName('get-revision')) {
			return null;
		}

		const getRevisionAction = resourceEntity.getActionByName('get-revision');
		const getMediaResponse = await this._fetch({ url: getRevisionAction.href });
		if (!getMediaResponse) {
			return null;
		}
		const mediaEntity = SirenParse(getMediaResponse);
		return this._formatRevision(mediaEntity.properties);
	}

	async getThumbnails(resourceEntity) {
		if (!resourceEntity || !resourceEntity.hasActionByName('get-thumbnails')) {
			return null;
		}

		try {
			const getThumbnailsAction = resourceEntity.getActionByName('get-thumbnails');
			const thumbnailsResponse = await this._fetch({ url: getThumbnailsAction.href });
			const thumbnailsEntity = SirenParse(thumbnailsResponse);
			return thumbnailsEntity.properties;
		} catch (e) {
			if (e.code !== 404) throw e;
			return null;
		}
	}

	async _fetch({
		url,
		method = 'GET',
		query,
		body,
		extractJsonBody = true,
		headers = new Headers(),
		doNotUseCache = true
	}) {

		if (body) {
			headers.append('Content-Type', 'application/json');
		}

		if (doNotUseCache) {
			headers.append('pragma', 'no-cache');
			headers.append('cache-control', 'no-cache');
		}

		const requestInit = {
			method,
			...body && {
				body: JSON.stringify(body)
			},
			headers
		};
		const request = new Request(this._url(url, query), requestInit);
		const response = await this.d2lfetch.fetch(request);
		if (!response.ok) {
			const err = new Error(response.statusText);
			err.code = response.status;
			throw err;
		}

		if (extractJsonBody) {
			return response.json();
		}

		return response;
	}

	_formatRevision(revision) {
		revision.type = ContentType.get(revision.type);
		revision.formats = revision.formats.map(format => VideoFormat.get(format));
		return revision;
	}

	_url(url, query) {
		const qs = query ? `?${querystring.stringify(query)}` : '';
		return `${url}${qs}`;
	}
}
