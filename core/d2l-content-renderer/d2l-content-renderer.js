import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';

import '../d2l-content-media-player.js';
import '../d2l-content-pdf-player.js';
import '../d2l-content-image-player.js';
import '../d2l-content-scorm-player.js';
import '../d2l-renderer-status-message.js';
import { RevisionLoaderMixin } from '../mixins/revision-loader-mixin.js';
import RenderErrors from '../../util/render-errors';

class ContentRenderer extends RevisionLoaderMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			allowDownload: { type: Boolean, attribute: 'allow-download' },
			allowDownloadOnError: { type: Boolean, attribute: 'allow-download-on-error' },
			fullPageView: { type: Boolean, attribute: 'full-page-view' },
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
				display: inline;
			}
		`;
	}

	render() {
		if (!this.d2lrn && !(this.tenantId && this.contentId)) {
			return;
		}

		if (this._renderError) {
			let errorTerm;
			switch (this._renderError) {
				case RenderErrors.REVISION_NOT_FOUND:
					errorTerm = 'deletedFile';
					break;
				case RenderErrors.FORBIDDEN:
					errorTerm = 'errorForbidden';
					break;
				case RenderErrors.INSIDE_SANDBOX_ERROR:
					errorTerm = 'errorInSandbox';
					break;
				default:
					errorTerm = 'generalErrorMessage';
					break;
			}

			return this.renderStatusMessage(this.localize(errorTerm));
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

		switch (type) {
			case 'Video':
			case 'Audio':
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
						?framed=${this.framed}
						?full-page-view=${this.fullPageView}
						?inserting=${this.inserting}
						revision-tag=${ifDefined(this._revisionTag)}
						tenant-id=${ifDefined(this._tenantId)}
					></d2l-content-media-player>
				`;
			case 'Scorm':
				return html`
					<d2l-content-scorm-player
						id="player"
						content-service-endpoint=${this.contentServiceEndpoint}
						context-type=${ifDefined(this.contextType)}
						context-id=${ifDefined(this.contextId)}
						d2lrn=${this.d2lrn}
						?framed=${this.framed}
						?full-page-view=${this.fullPageView}
						?preview=${this.preview}
					></d2l-content-scorm-player>
				`;
			case 'Document':
				return html`
					<d2l-content-pdf-player
						id="player"
						content-service-endpoint=${this.contentServiceEndpoint}
						context-type=${ifDefined(this.contextType)}
						context-id=${ifDefined(this.contextId)}
						d2lrn=${this.d2lrn}
						?framed=${this.framed}
					></d2l-content-pdf-player>
				`;
			case 'Image':
				return html`
					<d2l-content-image-player
						id="player"
						content-service-endpoint=${this.contentServiceEndpoint}
						context-type=${ifDefined(this.contextType)}
						context-id=${ifDefined(this.contextId)}
						d2lrn=${this.d2lrn}
						?framed=${this.framed}
					></d2l-content-image-player>
				`;
			default:
				return html`<h1>${this.localize('unsupportedType')}</h1>`;
		}
	}

	get player() {
		return this.renderRoot.querySelector('#player');
	}

	reloadResources(reloadRevision = true) {
		this.player.reloadResources(reloadRevision);
	}

	renderStatusMessage(message) {
		return html`<d2l-renderer-status-message>${message}</d2l-renderer-status-message>`;
	}
}
customElements.define('d2l-content-renderer', ContentRenderer);
