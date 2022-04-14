import '@brightspace-ui-labs/media-player/media-player.js';
import { getDocumentLocaleSettings } from '@brightspace-ui/intl/lib/common.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';

import ContentServiceClient from './src/clients/rest-client.js';
import HypermediaClient from './src/clients/hypermedia-client.js';
import { VideoFormat, ContentType } from './src/clients/enums.js';
import { InternalLocalizeMixin } from './src/mixins/internal-localize-mixin.js';

const TRACK_ERROR_FETCH_WAIT_MILLISECONDS = 5000;
const REVISION_POLL_WAIT_MILLISECONDS = 10000;
const VALID_CONTENT_TYPES = [ContentType.Video, ContentType.Audio];
const VIDEO_FORMATS_BEST_FIRST = [VideoFormat.HD, VideoFormat.SD, VideoFormat.LD, VideoFormat.MP3];

class ContentViewer extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			_captionSignedUrls: { type: Array, attribute: false },
			_mediaSources: { type: Array, attribute: false },
			_metadata: { type: String, attribute: false },
			_poster: { type: String, attribute: false },
			_revision: { type: Object, attribute: false },
			_thumbnails: { type: String, attribute: false },
			_bestFormat: { type: String, attribute: false },
			activity: { type: String, attribute: 'activity' },
			allowDownload: { type: Boolean, attribute: 'allow-download'},
			allowDownloadOnError: { type: Boolean, attribute: 'allow-download-on-error' },
			framed: { type: Boolean, value: false, attribute: 'framed' },
			noMediaFound: { type: Boolean, attribute: false },
			orgUnitId: { type: Number, attribute: 'org-unit-id' },
			topicId: { type: Number, attribute: 'topic-id' },
			// href and captions-href deprecated, use orgUnitId and topicId instead
			href: { type: String, attribute: 'href' },
			captionsHref: { type: String, attribute: 'captions-href' }
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
		this._resourceEntity = null;
		this._captionSignedUrls = [];
		this._lastTrackLoadFailedTime = null;
		this._trackErrorFetchTimeoutId = null;
		this._revision = null;
		this._thumbnails = null;
		this._metadata = null;
		this._poster = null;
		this._attemptedReloadOnError = false;
		this._bestFormat = '';
		this.noMediaFound = false;
	}

	async firstUpdated() {
		super.firstUpdated();

		if (this.activity) {
			this.hmClient = new HypermediaClient({
				entity: this.activity,
				framed: this.framed
			});
			this._resourceEntity = await this.hmClient.getResourceEntity();
		} else {
			this.client = new ContentServiceClient({
				topicId: this.topicId,
				orgUnitId: this.orgUnitId
			});
		}

		await this._setup();

		this.dispatchEvent(new CustomEvent('cs-content-loaded', {
			bubbles: true,
			composed: true,
		}));
	}

	render() {
		if (this.noMediaFound) {
			return html`
			<div id="status-container">
				${this.localize('deletedMedia')}
			</div>
			`;
		}
		if (!this._revision) {
			return html``;
		}
		if (!this._revision.ready) {
			return html`
				<div id="status-container">
					${this.localize('mediaFileIsProcessing')}
				</div>
			`;
		}
		if (this._mediaSources && this._mediaSources.length > 0) {
			return html`
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

		if (!this.noMediaFound && this._revision.type === ContentType.Video) {
			await this._loadMetadata();
			await this._loadPoster();
			await this._loadThumbnails();
		}
	}

	async _download() {
		let downloadUrl = '';
		if (this.activity) {
			downloadUrl = await this.hmClient.getMediaWithBestFormat({resourceEntity: this._resourceEntity, attachment: true});
		} else {
			downloadUrl = await this.client.getDownloadUrl({attachment: true});
		}

		if (downloadUrl) {
			const anchor = document.createElement('a');
			anchor.href = downloadUrl.src;
			anchor.download = '';
			anchor.click();
		}
	}

	_getLabel(format) {
		return this.localize(`format${format}`) || format;
	}

	async _getMediaSource(format) {
		return this.client.getDownloadUrl({format, href: this.href});
	}

	async _loadCaptions() {
		clearInterval(this._trackErrorFetchTimeoutId);
		this._trackErrorFetchTimeoutId = null;

		const captionSignedUrls = this.activity
			? await this.hmClient.getCaptions(this._resourceEntity)
			: await this.client.getCaptions(this.captionsHref);

		if (captionSignedUrls) {
			// This forces a slot change event for the media player so it can render the new captions
			this._captionSignedUrls = [];
			this.requestUpdate();
			await this.updateComplete;

			this._captionSignedUrls = captionSignedUrls;
			this._captionsSignedUrlExpireTime = ((this._captionSignedUrls.length && this._captionSignedUrls[0].ExpireTime) || 0) * 1000;
			this.requestUpdate();
		}
	}

	_loadLocale() {
		const defaultLocale = getDocumentLocaleSettings()._language || getDocumentLocaleSettings()._fallbackLanguage;

		if (!defaultLocale) return;
		const mediaPlayer = this.shadowRoot.querySelector('d2l-labs-media-player');
		mediaPlayer.locale = defaultLocale.toLowerCase();
	}

	async _loadMedia() {
		if (this.activity) {
			this._mediaSources = await this.hmClient.getMedia(this._resourceEntity);
		} else if (this.href || !this._revision.formats || this._revision.formats.length === 0) {
			this._mediaSources = [await this._getMediaSource()];
		} else {
			this._mediaSources = await Promise.all(this._revision.formats.map(format => this._getMediaSource(format)));
		}

		this._bestFormat = this._mediaSources.length > 1 ? VIDEO_FORMATS_BEST_FIRST.find(format =>
			this._mediaSources.some(mediaSource => mediaSource.format && mediaSource.format === format)
		) : '';
	}

	async _loadMetadata() {
		const result = this.activity ? await this.hmClient.getMetadata(this._resourceEntity)
			: await this.client.getMetadata();
		if (result) {
			this._metadata = JSON.stringify(result);
		}
	}

	async _loadPoster() {
		const result = this.activity ?
			this._resourceEntity.entities.find(entity => entity.class.find(name => name === 'thumbnail'))
			: await this.client.getPoster();

		if (result) this._poster = result.Value || result.properties.src;
	}

	async _loadRevisionData() {
		const revision = this.activity ? await this.hmClient.getRevision(this._resourceEntity) : await this.client.getRevision();
		if (!revision) {
			this.noMediaFound = true;
			return;
		}
		this._revision = this.activity ?
			{ type: revision.type, formats: revision.formats, ready: revision.ready } :
			{ type: revision.Type, formats: revision.Formats, ready: revision.Ready };

		this._verifyContentType(this._revision.type);
	}

	async _loadThumbnails() {
		if (this.activity) {
			const result = await this.hmClient.getThumbnails(this._resourceEntity);
			if (result) this._thumbnails = result.value;
		} else {
			const result = await this.client.getThumbnails();
			if (result) this._thumbnails = result.Value;
		}
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
		return html`<track src="${captionsUrl.Value}" kind="captions" label=${captionsUrl.Locale} srclang=${captionsUrl.Locale}>`;
	}

	_renderMediaSource(source) {
		return html`<source src=${source.src} label=${this._getLabel(source.format || 'Source')} ?default=${source.format === this._bestFormat}>`;
	}

	async _setup() {
		await this._loadRevisionData();
		if (!this.noMediaFound && this._revision && this._revision.ready) {
			await this._setupAfterRevisionReady();
		} else if (!this.noMediaFound && this._revision && !this._revision.ready) {
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
customElements.define('d2l-content-viewer', ContentViewer);
