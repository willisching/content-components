import '../d2l-content-selector-list.js';
import '@brightspace-ui/core/components/button/button.js';
import { heading4Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { RtlMixin } from '@brightspace-ui/core/mixins/rtl-mixin';
import { css, html, LitElement } from 'lit';
import { InternalLocalizeMixin } from '../../mixins/internal-localize-mixin';

import ContentType from '../../util/content-type.js';
import ContentServiceBrowserHttpClient from '@d2l/content-service-browser-http-client';
import { BrightspaceApiClient } from '@d2l/content-service-shared-utils';

class MediaLibraryQuicklinkSelector extends RtlMixin(InternalLocalizeMixin(LitElement)) {
	static get properties() {
		return {
			canManageAllObjects: { type: Boolean, attribute: 'can-manage-all-objects' },
			contentServiceEndpoint: { type: String, attribute: 'content-service-endpoint' },
			orgUnitId: { type: Number, attribute: 'org-unit-id' },
			moduleId: { type: Number, attribute: 'module-id' },
			tenantId: { type: String, attribute: 'tenant-id' },
			userId: { type: String, attribute: 'user-id' }
		};
	}

	static get styles() {
		return [heading4Styles, css`
			.d2l-media-library-quicklink-selector-container {
				height: 100%;
			}

			.d2l-media-library-quicklink-selector-header {
				padding-top: 10px;
				margin-bottom: -10px;
			}

			.d2l-media-library-quicklink-selector-header h4 {
				margin: 0;
			}
		`];
	}

	constructor() {
		super();
		this._height = 0;
		this._supportedTypes = [ContentType.AUDIO, ContentType.VIDEO];
		this._clientApps = ['LmsContent', 'LmsCapture', 'VideoNote', 'Capture', 'LmsCourseImport', 'none'];
	}

	connectedCallback() {
		super.connectedCallback();

		this.brightspaceClient = new BrightspaceApiClient({
			httpClient: new ContentServiceBrowserHttpClient()
		});
	}

	firstUpdated() {
		super.firstUpdated();
		this.resize(this._height);
	}

	render() {
		return html`
			<div class="d2l-media-library-quicklink-selector-container">
				<div id="selector-header" class="d2l-media-library-quicklink-selector-header">
					<h4>${this.localize('mediaLibrary')}</h4>
				</div>
				<div id="selector-list-container">
					<d2l-content-selector-list
						allowSelection
						?canManageAllObjects=${this.canManageAllObjects}
						.contentTypes=${this._supportedTypes}
						.clientApps=${this._clientApps}
						serviceUrl=${this.contentServiceEndpoint}
						tenantId=${this.tenantId}
						userId=${this.userId}
						@object-selected=${this._handleObjectSelected}
					>
					</d2l-content-selector-list>
				</div>
				<div id="button-group">
					<d2l-button
						primary
						description=${this.localize('add')}
						@click=${this._addQuicklink}
					>${this.localize('add')}</d2l-button>
					<d2l-button
						description=${this.localize('cancel')}
						@click=${this._cancel}
					>${this.localize('cancel')}</d2l-button>
				</div>
			</div>
		`;
	}

	resize(height) {
		this._height = height;
		if (this.shadowRoot) {
			const header = this.shadowRoot.getElementById('selector-header');
			const footer = this.shadowRoot.getElementById('button-group');
			if (header && footer) {
				this.shadowRoot.getElementById('selector-list-container').style.height = `${height - header.offsetHeight - footer.offsetHeight}px`;
			}
		}
	}

	_addQuicklink() {
		this.dispatchEvent(new CustomEvent('create-quicklink', {
			bubbles: true,
			composed: true,
			detail: {
				typeKey: 'mediaLibrary',
				itemId: `mediaLibrary-${this._selectedObject.id}`,
				itemTitle: this._selectedObject.lastRevTitle
			}
		}));
	}

	_cancel() {
		this.dispatchEvent(new CustomEvent('cancel'));
	}

	_handleObjectSelected() {
		this._selectedObject = this.shadowRoot.querySelector('d2l-content-selector-list').selectedContent;
	}
}

customElements.define('d2l-media-library-quicklink-selector', MediaLibraryQuicklinkSelector);
