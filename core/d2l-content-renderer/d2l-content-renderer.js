import '../d2l-content-media-player.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from './src/mixins/internal-localize-mixin.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import '../d2l-content-scorm-player.js';
import { RevisionLoaderMixin } from '../mixins/revision-loader-mixin.js';

class ContentRenderer extends RevisionLoaderMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			allowDownload: { type: Boolean, attribute: 'allow-download' },
			allowDownloadOnError: { type: Boolean, attribute: 'allow-download-on-error' },
			inserting: { type: Boolean },
			preview: { type: Boolean }
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

	render() {
		return this.renderPlayer();
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
		if (!this.d2lrn && !(this.tenantId && this.contentId)) {
			return;
		}

		if (this._d2lrnParseError) {
			return this.renderStatusMessage(this.localize('generalErrorMessage'));
		}

		if (this._noRevisionFound) {
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

		const type = this._revision.type;
		if (type === 'Video' || type === 'Audio') {
			return html`
			<d2l-content-media-player
				id="player"
				?allow-download=${this.allowDownload}
				?allow-download-on-error=${this.allowDownloadOnError}
				content-service-endpoint=${ifDefined(this.contentServiceEndpoint)}
				content-id=${ifDefined(this._contentId)}
				context-id=${ifDefined(this.contextId)}
				context-type=${ifDefined(this.contextType)}
				d2lrn=${ifDefined(this.d2lrn)}
				revision-tag=${ifDefined(this._revisionTag)}
				tenant-id=${ifDefined(this._tenantId)}
				?inserting=${this.inserting}
			></d2l-content-media-player>
		`;
		}

		if (type === 'Scorm') {
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
