import '@brightspace-ui-labs/media-player/media-player.js';
import { getDocumentLocaleSettings } from '@brightspace-ui/intl/lib/common.js';
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

		await this.loadRevisionData();
		await this.loadCaptions();
		this.loadLocale();
		await this.loadMetadata();

		this.dispatchEvent(new CustomEvent('cs-content-loaded', {
			bubbles: true,
			composed: true,
		}));
	}

	render() {
		return this._mediaSources && this._mediaSources.length > 0 && html`
			<d2l-labs-media-player
				crossorigin="anonymous"
				@trackloadfailed=${this.trackLoadFailedHandler}
				@tracksmenuitemchanged=${this.tracksChangedHandler}
				?allow-download=${this.allowDownload}
				?allow-download-on-error=${this.allowDownloadOnError}>
				${this._mediaSources.map(mediaSource => this._renderMediaSource(mediaSource))}
				${this._captionSignedUrls.map(captionSignedUrl => this._renderCaptionsTrack(captionSignedUrl))}
			</d2l-labs-media-player>
		`;
	}

	async loadCaptions() {
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

	loadLocale() {
		const defaultLocale = getDocumentLocaleSettings()._language || getDocumentLocaleSettings()._fallbackLanguage;

		if (!defaultLocale) return;
		const mediaPlayer = this.shadowRoot.querySelector('d2l-labs-media-player');
		mediaPlayer.locale = defaultLocale.toLowerCase();
	}

	async loadMetadata() {
		const metadata = this.activity ? await this.hmClient.getMetadata(this._resourceEntity)
			: await this.client.getMetadata();

		if (!metadata) return;
		const mediaPlayer = this.shadowRoot.querySelector('d2l-labs-media-player');
		mediaPlayer.metadata = metadata;
	}

	async loadRevisionData() {
		if (this.activity) {
			const revision = await this.hmClient.getRevision(this._resourceEntity);
			this._verifyContentType(revision.type);
			this._mediaSources = await this.hmClient.getMedia(this._resourceEntity);
		} else if (this.href) {
			this._mediaSources = [await this._getMediaSource()];
		} else {
			const revision = await this.client.getRevision();
			this._verifyContentType(revision.Type);
			this._mediaSources = await Promise.all(revision.Formats.map(format => this._getMediaSource(format)));
		}
	}

	async trackLoadFailedHandler() {
		const elapsedTimeSinceLastTrackLoadFailed = (new Date()).getTime() - (this._lastTrackLoadFailedTime || 0);
		const trackErrorFetchIntervalElapsed = elapsedTimeSinceLastTrackLoadFailed > TRACK_ERROR_FETCH_INTERVAL_MILLISECONDS;

		if (trackErrorFetchIntervalElapsed && !this._trackErrorFetchTimeoutId) {
			this._lastTrackLoadFailedTime = (new Date()).getTime();
			await this.loadCaptions();
		} else if (!trackErrorFetchIntervalElapsed && !this._trackErrorFetchTimeoutId) {
			this._lastTrackLoadFailedTime = (new Date()).getTime();
			this._trackErrorFetchTimeoutId = setTimeout(this.loadCaptions.bind(this), TRACK_ERROR_FETCH_INTERVAL_MILLISECONDS);
		}
	}

	async tracksChangedHandler() {
		const elapsedTimeSinceLoadCaptions = (new Date()).getTime() - this._captionsSignedUrlStartTime;
		if (elapsedTimeSinceLoadCaptions > this._captionsSignedUrlExpireTime) {
			await this.loadCaptions();
		}
	}

	async _getMediaSource(format) {
		return {
			src: (await this.client.getDownloadUrl({format, href: this.href})).Value,
			format,
		};
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
