import '@brightspace-ui/core/components/offscreen/offscreen.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import { getDocumentLocaleSettings } from '@brightspace-ui/intl/lib/common.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { ContentServiceApiClient } from '@d2l/content-service-shared-utils';

import '../d2l-renderer-status-message.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { RevisionLoaderMixin } from '../mixins/revision-loader-mixin.js';

const TRACK_ERROR_FETCH_WAIT_MILLISECONDS = 5000;
const VALID_CONTENT_TYPES = ['Video', 'Audio'];
const VIDEO_FORMATS_BEST_FIRST = ['hd', 'sd', 'ld', 'mp3'];

class ContentMediaPlayer extends RevisionLoaderMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			_bestFormat: { type: String, attribute: false },
			_captionSignedUrls: { type: Array, attribute: false },
			_mediaSources: { type: Array, attribute: false },
			_metadata: { type: String, attribute: false },
			_poster: { type: String, attribute: false },
			_thumbnails: { type: String, attribute: false },
			_playbackSupported: { type: Boolean, attribute: false },
			allowDownload: { type: Boolean, attribute: 'allow-download'},
			allowDownloadOnError: { type: Boolean, attribute: 'allow-download-on-error' },
			framed: { type: Boolean, value: false }
		};
	}

	static get styles() {
		return css`
			:host {
				display: inline-block;
			}
			:host([hidden]) {
				display: none;
			}
			#player {
				width: 100%;
			}
		`;
	}

	constructor() {
		super();
		this._captionSignedUrls = [];
		this._lastTrackLoadFailedTime = null;
		this._trackErrorFetchTimeoutId = null;
		this._thumbnails = null;
		this._metadata = null;
		this._poster = null;
		this._attemptedReloadOnError = false;
		this._playbackSupported = false;
		this._bestFormat = null;
	}

	render() {
		if (this._mediaSources && this._mediaSources.length > 0) {
			return html`
			<d2l-offscreen>${this.localize('offscreenInfoMessage', { title: this._revision.title, description: this._revision.description })}</d2l-offscreen>
			<d2l-labs-media-player
				id="player"
				crossorigin="anonymous"
				media-type="${this._revision.type === 'Video' ? 'video' : 'audio'}"
				metadata=${ifDefined(this._metadata ? this._metadata : undefined)}
				poster=${ifDefined(this._poster ? this._poster : undefined)}
				thumbnails=${ifDefined(this._thumbnails ? this._thumbnails : undefined)}
				@error=${this._onError}
				@loadeddata=${this._onLoadedData}
				@trackloadfailed=${this._onTrackLoadFailed}
				@tracksmenuitemchanged=${this._onTracksChanged}
				?allow-download-on-error=${this.allowDownloadOnError}>
				${this._mediaSources.map(mediaSource => this._renderMediaSource(mediaSource))}
				${this._captionSignedUrls.map(captionSignedUrl => this._renderCaptionsTrack(captionSignedUrl))}
				${this.allowDownload ? html`<d2l-menu-item slot='settings-menu-item' id='download-menu-item' text=${this.localize('download')}></d2l-menu-item>` : ''}
			</d2l-labs-media-player>
			`;
		}
	}

	async updated(changedProperties) {
		super.updated(changedProperties);

		if (changedProperties.has('_revision')) {
			if (!changedProperties._revision && this._revision) {
				const httpClient = new ContentServiceBrowserHttpClient({
					serviceUrl: this.contentServiceEndpoint,
					framed: this.framed
				});
				this.client = new ContentServiceApiClient({
					httpClient,
					tenantId: this._tenantId,
					contextType: this.contextType,
					contextId: this.contextId
				});

				this.dispatchEvent(new CustomEvent('cs-content-loaded', {
					bubbles: true,
					composed: true,
					detail: {
						revision: this._revision,
						supportsAdvancedEditing: true
					}
				}));

				this._verifyContentType(this._revision.type);

				await this._setupAfterRevisionReady();
			}
		}
	}

	async reloadResources(reloadRevision = true) {
		if (reloadRevision) {
			await this._loadRevision();
		}
		await this._loadMedia();
		await this._loadCaptions();

		if (!this._noRevisionFound && this._revision.type === 'Video') {
			await this._loadMetadata();
			await this._loadPoster();
			await this._loadThumbnails();
		}
	}

	renderStatusMessage(message) {
		return html`<d2l-renderer-status-message>${message}</d2l-renderer-status-message>`;
	}

	async _download() {
		const downloadUrl = await this._getMediaSource();
		if (downloadUrl) {
			const anchor = document.createElement('a');
			anchor.href = downloadUrl.src;
			anchor.download = '';
			anchor.click();
		}
	}

	async _getMediaSource(format) {
		const mediaSource = await this._getResource({
			resource: 'transcodes',
			query: {
				disposition: 'attachment',
				...(format ? {format} : {})
			}
		});
		return {
			src: mediaSource.value,
			format
		};
	}

	async _getResource({resource, outputFormat = 'signed-url', query = {}}) {
		let result;
		try {
			result = await this.client.content.getResource({
				id: this._contentId,
				revisionTag: this._revisionTag,
				resource,
				outputFormat,
				query
			});
		} catch (error) {
			if (error.cause !== 404) {
				throw error;
			}
		}

		return result;
	}

	async _loadCaptions() {
		clearTimeout(this._trackErrorFetchTimeoutId);
		this._trackErrorFetchTimeoutId = null;

		const captionSignedUrls = await this._getResource({
			resource: 'captions',
			outputFormat: 'signed-urls'
		});

		if (captionSignedUrls) {
			// This forces a slot change event for the media player so it can render the new captions
			this._captionSignedUrls = [];
			this.requestUpdate();
			await this.updateComplete;

			this._captionSignedUrls = captionSignedUrls;
			this._captionsSignedUrlExpireTime = ((this._captionSignedUrls.length && this._captionSignedUrls[0].expireTime) || 0) * 1000;
			this.requestUpdate();
		}
	}

	_loadLocale() {
		const defaultLocale = getDocumentLocaleSettings()._language || getDocumentLocaleSettings()._fallbackLanguage;

		if (!defaultLocale) return;
		const mediaPlayer = this.shadowRoot.querySelector('d2l-labs-media-player');
		if (mediaPlayer) {
			mediaPlayer.locale = defaultLocale.toLowerCase();
		}
	}

	async _loadMedia() {
		const hasFormats = this._revision.formats && this._revision.formats.length > 0;
		this._mediaSources = hasFormats ?
			await Promise.all(this._revision.formats.map(format => this._getMediaSource(format))) :
			[await this._getMediaSource()];

		this._bestFormat = this._mediaSources.length > 1 ?
			VIDEO_FORMATS_BEST_FIRST.find(format =>
				this._mediaSources.some(mediaSource => mediaSource.format && mediaSource.format === format)
			) : null;
	}

	async _loadMetadata() {
		const result = await this._getResource({
			resource: 'metadata',
			outputFormat: 'file-content'
		});
		if (result) {
			this._metadata = JSON.stringify(result);
		}
	}

	async _loadPoster() {
		const result = await this._getResource({ resource: 'poster' });
		if (result) this._poster = result.value;
	}

	async _loadThumbnails() {
		const result = await this._getResource({
			resource: 'thumbnails'
		});
		if (result) this._thumbnails = result.value;
	}

	_onError() {
		if (this._mediaSources && this._mediaSources.length > 0 && !this._attemptedReloadOnError) {
			this._attemptedReloadOnError = true;
			this._loadMedia();
		}
	}

	_onLoadedData() {
		this._attemptedReloadOnError = false;
	}

	async _onTrackLoadFailed() {
		const timeNow = Date.now();
		const timeSinceLastTrackLoadFailed = timeNow - (this._lastTrackLoadFailedTime || 0);
		const shouldWaitToLoadCaptions = timeSinceLastTrackLoadFailed <= TRACK_ERROR_FETCH_WAIT_MILLISECONDS;

		if (this._trackErrorFetchTimeoutId) {
			return;
		}

		this._lastTrackLoadFailedTime = timeNow;
		if (shouldWaitToLoadCaptions) {
			this._trackErrorFetchTimeoutId = setTimeout(this._loadCaptions.bind(this), TRACK_ERROR_FETCH_WAIT_MILLISECONDS);
		} else {
			await this._loadCaptions();
		}
	}

	async _onTracksChanged() {
		if (Date.now() > this._captionsSignedUrlExpireTime) {
			await this._loadCaptions();
		}
	}

	_renderCaptionsTrack(captionsUrl) {
		return html`<track src="${captionsUrl.value}" kind="captions" label="${captionsUrl.locale}" srclang=${captionsUrl.locale}>`;
	}

	_renderMediaSource(source) {
		return html`<source src=${source.src} label=${this.localize(`format${!source.format ? 'Source' : source.format.toUpperCase()}`)} ?default=${source.format === this._bestFormat}>`;
	}

	async _setupAfterRevisionReady() {
		await this.reloadResources(false);
		this._setupDownload();
		this._loadLocale();
	}

	_setupDownload() {
		if (this.allowDownload) {
			const downloadMenuItem = this.shadowRoot.querySelector('#download-menu-item');
			if (downloadMenuItem) {
				downloadMenuItem.addEventListener('d2l-menu-item-select', this._download.bind(this));
			}
		}
	}

	async _verifyContentType(type) {
		if (!VALID_CONTENT_TYPES.includes(type)) {
			throw new Error(`type ${type.key} unsupported`);
		}
	}
}
customElements.define('d2l-content-media-player', ContentMediaPlayer);
