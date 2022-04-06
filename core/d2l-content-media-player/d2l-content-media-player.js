import '@brightspace-ui/core/components/offscreen/offscreen.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import { getDocumentLocaleSettings } from '@brightspace-ui/intl/lib/common.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';

import ContentServiceClient from './src/clients/rest-client.js';
import { VideoFormat, ContentType } from './src/clients/enums.js';
import { InternalLocalizeMixin } from './src/mixins/internal-localize-mixin.js';

const TRACK_ERROR_FETCH_WAIT_MILLISECONDS = 5000;
const REVISION_POLL_WAIT_MILLISECONDS = 10000;
const VALID_CONTENT_TYPES = [ContentType.Video, ContentType.Audio];

class ContentMediaPlayer extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			_captionSignedUrls: { type: Array, attribute: false },
			_mediaSources: { type: Array, attribute: false },
			_metadata: { type: String, attribute: false },
			_poster: { type: String, attribute: false },
			_revision: { type: Object, attribute: false },
			_thumbnails: { type: String, attribute: false },
			_noMediaFound: { type: Boolean, attribute: false },
			_error: { type: Boolean, attribtue: false },
			_playbackSupported: { type: Boolean, attribute: false },
			allowDownload: { type: Boolean, attribute: 'allow-download'},
			allowDownloadOnError: { type: Boolean, attribute: 'allow-download-on-error' },
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			contextId: { type: String, attribute: 'context-id' },
			contextType: { type: String, attribute: 'context-type' },
			d2lrn: { type: String, attribute: 'd2lrn' },
			framed: { type: Boolean, value: false, attribute: 'framed' }
		};
	}

	static get styles() {
		return css`
			:host {
				display: inline-block;
				width: 100%;
			}
			:host([hidden]) {
				display: none;
			}
			#status-container {
				aspect-ratio: 16/9;
				background-color: black;
				color: white;
				display: flex;
				flex-direction: column;
				justify-content: center;
 				overflow: hidden;
 				position: relative;
				text-align: center;
 				width: 100%;
			}
		`;
	}

	constructor() {
		super();
		this._captionSignedUrls = [];
		this._lastTrackLoadFailedTime = null;
		this._trackErrorFetchTimeoutId = null;
		this._revision = null;
		this._thumbnails = null;
		this._metadata = null;
		this._poster = null;
		this._attemptedReloadOnError = false;
		this._noMediaFound = false;
		this._error = false;
		this._playbackSupported = false;
	}

	async firstUpdated() {
		super.firstUpdated();
		// d2l:brightspace:content:<region>:<tenantId>:<type>:<id>/<revisionId>
		const splitD2lrn = this.d2lrn.split(':');
		if (splitD2lrn.length < 7) {
			this._error = true;
			return;
		}

		const tenantId = splitD2lrn[4];
		const [contentId, revisionId = 'latest'] = splitD2lrn[6].split('/');

		this.client = new ContentServiceClient({
			contentId,
			contextId: this.contextId,
			contextType: this.contextType,
			endpoint: this.contentServiceEndpoint,
			revisionId,
			tenantId,
		});
		await this._setup();

		this.dispatchEvent(new CustomEvent('cs-content-loaded', {
			bubbles: true,
			composed: true,
		}));
	}

	render() {
		if (this._error) {
			return this.renderStatusMessage(this.localize('generalErrorMessage'));
		}

		if (this._noMediaFound) {
			return this.renderStatusMessage(this.localize('deletedMedia'));
		}

		if (!this._revision) {
			return html``;
		}

		if (this._revision.processingFailed) {
			return this.renderStatusMessage(this.localize('revisionProcessingFailedMessage'));
		}

		if (!this._revision.ready) {
			return this.renderStatusMessage(this.localize('mediaFileIsProcessing'));
		}

		if (!this._playbackSupported) {
			return this.renderStatusMessage(this.localize('unsupportedPlaybackMessage'));
		}

		if (this._mediaSources && this._mediaSources.length > 0) {
			return html`
			<d2l-offscreen>${this.localize('offscreenInfoMessage', { title: this._revision.title, description: this._revision.description })}</d2l-offscreen>
			<d2l-labs-media-player
				crossorigin="anonymous"
				media-type="${this._revision.type === ContentType.Video ? 'video' : 'audio'}"
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

	async reloadResources(reloadRevision = true) {
		if (reloadRevision) {
			await this._loadRevisionData();
		}
		await this._loadMedia();
		await this._loadCaptions();

		if (!this._noMediaFound && this._revision.type === ContentType.Video) {
			await this._loadMetadata();
			await this._loadPoster();
			await this._loadThumbnails();
		}
	}

	renderStatusMessage(message) {
		return html`
			<div id="status-container">
				${message}
			</div>
		`;
	}

	async _download() {
		const downloadUrl = await this.client.getDownloadUrl({ attachment: true });

		if (downloadUrl) {
			const anchor = document.createElement('a');
			anchor.href = downloadUrl.src;
			anchor.download = '';
			anchor.click();
		}
	}

	async _getMediaSource(format) {
		return this.client.getDownloadUrl({format});
	}

	async _loadCaptions() {
		clearInterval(this._trackErrorFetchTimeoutId);
		this._trackErrorFetchTimeoutId = null;

		const captionSignedUrls = await this.client.getCaptions();

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
		this._mediaSources = await Promise.all(this._revision.formats.map(format => this._getMediaSource(format)));
	}

	async _loadMetadata() {
		const result = await this.client.getMetadata();
		if (result) {
			this._metadata = JSON.stringify(result);
		}
	}

	async _loadPoster() {
		const result = await this.client.getPoster();
		if (result) this._poster = result.value;
	}

	async _loadRevisionData() {
		const revision = await this.client.getRevision();

		if (!revision) {
			this._noMediaFound = true;
			return;
		}
		this._revision = {
			type: revision.type,
			formats: revision.formats,
			ready: revision.ready,
			processingFailed: revision.processingFailed,
			title: revision.title,
			description: revision.description
		};
		this._verifyContentType(this._revision.type);

		// Determine whether the type has supported playback
		const isVideo = this._revision.type === ContentType.Video;
		const playbackSupportTestElement = isVideo ? document.createElement('video') : document.createElement('audio');
		const mimeType = isVideo ? 'video/mp4' : 'audio/mp3' ;
		this._playbackSupported = playbackSupportTestElement.canPlayType && playbackSupportTestElement.canPlayType(mimeType).replace(/no/, '');
	}

	async _loadThumbnails() {
		const result = await this.client.getThumbnails();
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
		return html`<source src=${source.src} label=${source.format} ?default=${source.format === VideoFormat.HD}>`;
	}

	async _setup() {
		await this._loadRevisionData();
		if (!this._noMediaFound && this._revision && this._revision.ready) {
			await this._setupAfterRevisionReady();
		} else if (!this._noMediaFound && this._revision && !this._revision.ready) {
			setTimeout(() => {
				this._setup();
			}, REVISION_POLL_WAIT_MILLISECONDS);
		}
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
