import '../d2l-content-media-player.js';
import { css, html, LitElement } from 'lit-element/lit-element.js';
import { InternalLocalizeMixin } from './src/mixins/internal-localize-mixin.js';

class ContentRenderer extends InternalLocalizeMixin(LitElement) {
	static get properties() {
		return {
			allowDownload: { type: Boolean, attribute: 'allow-download' },
			allowDownloadOnError: { type: Boolean, attribute: 'allow-download-on-error' },
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			contextId: { type: String, attribute: 'context-id' },
			contextType: { type: String, attribute: 'context-type' },
			d2lrn: { type: String, attribute: 'd2lrn' },
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
		`;
	}

	render() {
		return this.renderPlayer();
	}

	renderErrorMessage() {
		return html`<h1>${this.localize('errorRenderingContent')}</h1>`;
	}

	renderPlayer() {
		if (!this.d2lrn || !this.contextId) {
			return this.renderErrorMessage();
		}

		// d2l:brightspace:content:<region>:<tenantId>:<type>:<id>/<revisionId>
		const d2lrnSplit = this.d2lrn.split(':');
		if (d2lrnSplit.length < 6) {
			return this.renderErrorMessage();
		}

		const type = this.d2lrn.split(':')[5];
		if (type === 'video' || type === 'audio') {
			return html`
			<d2l-content-media-player
				?allow-download=${this.allowDownload}
				?allow-download-on-error=${this.allowDownloadOnError}
				content-service-endpoint=${this.contentServiceEndpoint}
				context-id=${this.contextId}
				context-type=${this.contextType}
				d2lrn=${this.d2lrn}
			></d2l-content-media-player>
		`;
		}
		return html`<h1>${this.localize('unsupportedType')}</h1>`;
	}
}
customElements.define('d2l-content-renderer', ContentRenderer);
