import '../d2l-content-media-player.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from './src/mixins/internal-localize-mixin.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { parse } from '../../util/d2lrn.js';
import '../d2l-content-scorm-player.js';
import ContentServiceBrowserHttpClient from 'd2l-content-service-browser-http-client';
import { ContentServiceApiClient } from 'd2l-content-service-api-client';

class ContentRenderer extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			allowDownload: { type: Boolean, attribute: 'allow-download' },
			allowDownloadOnError: { type: Boolean, attribute: 'allow-download-on-error' },
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			contextId: { type: String, attribute: 'context-id' },
			contextType: { type: String, attribute: 'context-type' },
			d2lrn: { type: String, attribute: 'd2lrn' },

			inserting: { type: Boolean },
			preview: { type: Boolean },

			_revision: { type: Object, attribute: false },
			_noMediaFound: { type: Boolean, attribute: false },
			_error: { type: Boolean, attribtue: false },
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
		this._error = false;
		this._noMediaFound = false;
		this._revision = null;
	}

	connectedCallback() {
		super.connectedCallback();
		try {
			const { contentId, revisionId = 'latest', tenantId } = parse(this.d2lrn);
			this.contentId = contentId;
			this.revisionId = revisionId;
			this.tenantId = tenantId;
		} catch (e) {
			this._error = true;
			return;
		}
		const httpClient = new ContentServiceBrowserHttpClient({
			serviceUrl: this.contentServiceEndpoint
		});
		this.client = new ContentServiceApiClient({
			httpClient,
			tenantId: this.tenantId,
		});

		this.checkMediaInterval = setInterval(this.checkMediaFound.bind(this), 10000);
	}

	render() {
		return this.renderPlayer();
	}

	async checkMediaFound() {
		const revision = await this.client.content.getRevision({ id: this.contentId, revisionTag: this.revisionId });
		if (!revision) {
			this._noMediaFound = true;
			return;
		}

		this._revision = revision;

		if (this._noMediaFound || !this._revision || this._revision.ready) {
			clearInterval(this.checkMediaInterval);
		}
	}

	get player() {
		return this.renderRoot.querySelector('#player');
	}

	reloadResources(reloadRevision = true) {
		this.player.reloadResources(reloadRevision);
	}

	renderErrorMessage() {
		return html`<h1>${this.localize('errorRenderingContent')}</h1>`;
	}

	renderPlayer() {
		if (!this.d2lrn) {
			return;
		}

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

		const type = parse(this.d2lrn).resourceType;
		if (type === 'video' || type === 'audio') {
			return html`
			<d2l-content-media-player
				id="player"
				?allow-download=${this.allowDownload}
				?allow-download-on-error=${this.allowDownloadOnError}
				content-service-endpoint=${ifDefined(this.contentServiceEndpoint)}
				context-id=${ifDefined(this.contextId)}
				context-type=${ifDefined(this.contextType)}
				d2lrn=${this.d2lrn}
				?inserting=${this.inserting}
			></d2l-content-media-player>
		`;
		}

		if (type === 'scorm') {
			return html`
			<d2l-content-scorm-player
				id="player"
				?preview=${this.preview}
				content-service-endpoint=${this.contentServiceEndpoint}
				d2lrn=${this.d2lrn}
			></d2l-content-scorm-player>
			`;
		}
		return html`<h1>${this.localize('unsupportedType')}</h1>`;
	}

	renderStatusMessage(message) {
		return html`
			<div id="status-container">
				${message}
			</div>
		`;
	}
}
customElements.define('d2l-content-renderer', ContentRenderer);
