import '@brightspace-ui-labs/media-player/media-player.js';
import { getDocumentLocaleSettings } from '@brightspace-ui/intl/lib/common.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';

import ContentServiceClient from './src/clients/rest-client.js';
import HypermediaClient from './src/clients/hypermedia-client.js';
import { VideoFormat, ContentType } from './src/clients/enums.js';
import { InternalLocalizeMixin } from './src/mixins/internal-localize-mixin.js';

const TRACK_ERROR_FETCH_WAIT_MILLISECONDS = 5000;
const VALID_CONTENT_TYPES = [ContentType.Video, ContentType.Audio];

class ContentViewer extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			_mediaSources: { type: Array, attribute: false },
			_captionSignedUrls: { type: Array, attribute: false },
			_metadata: { type: String, attribute: false },
			_poster: { type: String, attribute: false },
			_thumbnails: { type: String, attribute: false },
			activity: { type: String, attribute: 'activity' },
			allowDownload: { type: Boolean, attribute: 'allow-download'},
			allowDownloadOnError: { type: Boolean, attribute: 'allow-download-on-error' },
			framed: { type: Boolean, value: false, attribute: 'framed' },
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

		await this.reloadResources();
		this._setupDownload();
		this._loadLocale();

		this.dispatchEvent(new CustomEvent('cs-content-loaded', {
			bubbles: true,
			composed: true,
		}));
	}

	render() {
		return this._mediaSources && this._mediaSources.length > 0 && html`
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

	async reloadResources() {
		await this._loadRevisionData();
		await this._loadMedia();
		await this._loadCaptions();

		if (this._revision.type === ContentType.Video) {
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
		} else if (this.href) {
			this._mediaSources = [await this._getMediaSource()];
		} else {
			this._mediaSources = await Promise.all(this._revision.formats.map(format => this._getMediaSource(format)));
		}
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
			this._resourceEntity.entities.find(entity => entity.class.find(name => name === 'thumbnail'))?.properties.src
			: await this.client.getPoster();

		if (result) this._poster = result.Value || result;
	}

	async _loadRevisionData() {
		if (this.activity) {
			const revision = await this.hmClient.getRevision(this._resourceEntity);
			this._revision = {
				type: revision.type,
				formats: revision.formats,
			};
		} else {
			const revision = await this.client.getRevision();
			this._revision = {
				type: revision.Type,
				formats: revision.Formats
			};
		}

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
		return html`<source src=${source.src} label=${source.format} ?default=${source.format === VideoFormat.HD}>`;
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
