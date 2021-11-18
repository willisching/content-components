import '@brightspace-ui-labs/media-player/media-player.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';

import ContentServiceClient from './src/clients/rest-client.js';
import HypermediaClient from './src/clients/hypermedia-client.js';
import { VideoFormat, ContentType } from './src/clients/enums.js';

const TRACK_ERROR_FETCH_INTERVAL_MILLISECONDS = 5000;
const VALID_CONTENT_TYPES = [ContentType.Video, ContentType.Audio];

class ContentViewer extends LitElement {
	static get properties() {
		return {
			_mediaSources: { type: Array, attribute: false },
			_captionSignedUrls: { type: Array, attribute: false },
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
		this._captionsSignedUrlStartTime = null;
		this._lastTrackLoadFailedTime = null;
		this._trackErrorFetchTimeoutId = null;
		this._revision = null;
		this._refreshExpiry = null;
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

		await this._loadRevisionData();
		await this._loadMedia();
		await this._loadCaptions();
		await this._loadMetadata();

		this.dispatchEvent(new CustomEvent('cs-content-loaded', {
			bubbles: true,
			composed: true,
		}));
	}

	render() {
		return this._mediaSources && this._mediaSources.length > 0 && html`
			<d2l-labs-media-player
				crossorigin="anonymous"
				@error=${this._onError}
				@trackloadfailed=${this._onTrackLoadFailed}
				@tracksmenuitemchanged=${this._onTracksChanged}
				?allow-download=${this.allowDownload}
				?allow-download-on-error=${this.allowDownloadOnError}>
				${this._mediaSources.map(mediaSource => this._renderMediaSource(mediaSource))}
				${this._captionSignedUrls.map(captionSignedUrl => this._renderCaptionsTrack(captionSignedUrl))}
			</d2l-labs-media-player>
		`;
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
			this._captionsSignedUrlStartTime = (new Date()).getTime();
			this._captionsSignedUrlExpireTime = ((this._captionSignedUrls.length && this._captionSignedUrls[0].ExpireTime) || 0) * 1000;
			this.requestUpdate();
		}
	}

	async _loadMetadata() {
		const metadata = this.activity ? await this.hmClient.getMetadata(this._resourceEntity)
			: await this.client.getMetadata();

		if (!metadata) return;
		const mediaPlayer = this.shadowRoot.querySelector('d2l-labs-media-player');
		mediaPlayer.metadata = metadata;
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

	_onError() {
		if (this._mediaSources && this._mediaSources.length > 0) {
			const expires = this._mediaSources[0].expires;
			if (this._refreshExpiry !== expires && expires - Date.now() < 0) {
				// Prevent multiple attempts to load with same URLs
				this._refreshExpiry = expires;

				// Get new signed URLs and load them
				this._loadMedia();
			}
		}
	}

	async _onTrackLoadFailed() {
		const elapsedTimeSinceLastTrackLoadFailed = (new Date()).getTime() - (this._lastTrackLoadFailedTime || 0);
		const trackErrorFetchIntervalElapsed = elapsedTimeSinceLastTrackLoadFailed > TRACK_ERROR_FETCH_INTERVAL_MILLISECONDS;

		if (trackErrorFetchIntervalElapsed && !this._trackErrorFetchTimeoutId) {
			this._lastTrackLoadFailedTime = (new Date()).getTime();
			await this._loadCaptions();
		} else if (!trackErrorFetchIntervalElapsed && !this._trackErrorFetchTimeoutId) {
			this._lastTrackLoadFailedTime = (new Date()).getTime();
			this._trackErrorFetchTimeoutId = setTimeout(this._loadCaptions.bind(this), TRACK_ERROR_FETCH_INTERVAL_MILLISECONDS);
		}
	}

	async _onTracksChanged() {
		const elapsedTimeSinceLoadCaptions = (new Date()).getTime() - this._captionsSignedUrlStartTime;
		if (elapsedTimeSinceLoadCaptions > this._captionsSignedUrlExpireTime) {
			await this._loadCaptions();
		}
	}

	async _getMediaSource(format) {
		return this.client.getDownloadUrl({format, href: this.href});
	}

	_renderCaptionsTrack(captionsUrl) {
		return html`<track src="${captionsUrl.Value}" kind="captions" label=${captionsUrl.Locale} srclang=${captionsUrl.Locale.slice(0, 2)}>`;
	}

	_renderMediaSource(source) {
		return html`<source src=${source.src} label=${source.format} ?default=${source.format === VideoFormat.HD}>`;
	}

	async _verifyContentType(type) {
		if (!VALID_CONTENT_TYPES.includes(type)) {
			throw new Error(`type ${type.key} unsupported`);
		}
	}
}
customElements.define('d2l-content-viewer', ContentViewer);
