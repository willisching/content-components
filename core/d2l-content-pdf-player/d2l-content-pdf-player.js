import { html, LitElement } from 'lit-element/lit-element.js';
import '@d2l/pdf-viewer';

import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin.js';
import { RevisionLoaderMixin } from '../mixins/revision-loader-mixin.js';

class ContentPdfPlayer extends RevisionLoaderMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			contextType: { type: String, attribute: 'context-type' },
			contextId: { type: String, attribute: 'context-id' },
			d2lrn: { type: String },
			framed: { type: Boolean, value: false },
			_url: { type: String, attribute: false }
		};
	}

	constructor() {
		super();
		this._url = null;
	}

	render() {
		return this._url ? html`
			<d2l-pdf-viewer class="pdf-viewer" src=${this._url}></d2l-pdf-viewer>
		` : '';
	}

	async updated(changedProperties) {
		super.updated(changedProperties);

		if (changedProperties.has('_revision')) {
			if (!changedProperties._revision && this._revision) {
				const result = await this._getResource({ resource: 'pdf' });
				this._url = result.value;
			}
		}
	}
}

customElements.define('d2l-content-pdf-player', ContentPdfPlayer);
