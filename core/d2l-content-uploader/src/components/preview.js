import '@brightspace-ui/core/components/button/button-subtle';
import '@brightspace-ui/core/components/inputs/input-text.js';
import '@brightspace-ui-labs/media-player/media-player.js';
import { css, html, LitElement } from 'lit-element';
import { bodyCompactStyles } from '@brightspace-ui/core/components/typography/styles.js';
import { RequesterMixin } from '@brightspace-ui/core/mixins/provider-mixin.js';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { InternalLocalizeMixin } from '../mixins/internal-localize-mixin';
import { getComposedActiveElement } from '@brightspace-ui/core/helpers/focus.js';
import { parse } from '../util/d2lrn';
import '../../../../capture/d2l-capture-producer.js';
import '../../../d2l-content-viewer.js';

export class Preview extends MobxReactionUpdate(RequesterMixin(InternalLocalizeMixin(LitElement))) {
	static get properties() {
		return {
			canManage: { type: Boolean, attribute: 'can-manage' },
			canUpload: { type: Boolean, attribute: 'can-upload' },
			fileType: { type: String, attribute: 'file-type', reflect: true },
			orgUnitId: { type: String, attribute: 'org-unit-id' },
			resource: { type: String, attribute: true },
			topicId: { type: String, attribute: 'topic-id' },
			_mediaSources: { type: Array, attribute: false },
		};
	}

	static get styles() {
		return [bodyCompactStyles, css`
			#container {
				display: flex;
				flex-direction: column;
				align-items: center;
			}
			#staged-file {
				display: table;
				margin: 0 auto;
			}
			#staged-file > * {
				margin: 3px 50px 3px 50px;
				display: inline-block;
			}
			#file-details {
				font-weight: 600;
				word-break: break-word;
				overflow-wrap: break-word;
			}
			#change-file-button[hidden],
			#advanced-editing-button[hidden] {
				display: none;
			}
		`];
	}

	constructor() {
		super();
		this.contentTitle = '';
		this.fileType = '';
		this._mediaSources = null;
		this._contentId = null;
		this._lastRefreshAttempted = null;
	}

	async connectedCallback() {
		super.connectedCallback();
		if (!this.topicId) {
			this._loadMediaPlayerSources();
		}

	}

	render() {
		const {contentId} = parse(this.resource);
		this._contentId = contentId;
		return html`
			<div id="container">
				${this._renderPreviewPlayer()}
				<div id="staged-file">
					<d2l-button-subtle
						id="change-file-button"
						aria-expanded="false"
						aria-haspopup="false"
						aria-label=${this.localize('changeFile')}
						text=${this.localize('changeFile')}
						@click=${this._onChangeFile}
						?hidden="${!this.canUpload}">
					</d2l-button-subtle>
					<d2l-button-subtle
						id="advanced-editing-button"
						aria-expanded="false"
						aria-haspopup="false"
						aria-label=${this.localize('advancedEditing')}
						text=${this.localize('advancedEditing')}
						@click=${this._onAdvancedEditing}
						?hidden="${!this.canManage}">
					</d2l-button-subtle>
				</div>
			</div>
		`;
	}

	_getApiEndpoint() {
		const client = this.requestInstance('content-service-client');
		return client.endpoint;
	}

	async _getSource(resourceUrn, format) {
		const client = this.requestInstance('content-service-client');
		const url = await client.getSecureUrlByName(resourceUrn, format);

		return {
			src: url.value,
			format,
			expires: url.expireTime * 1000
		};
	}

	_isAudio() {
		return this.fileType.startsWith('audio');
	}

	async _loadMediaPlayerSources() {
		const formats = this._isAudio() ? ['mp3'] : ['hd', 'sd'];
		this._mediaSources = this.resource ?
			await Promise.all(formats.map(format => this._getSource(this.resource, format))) :
			null;
	}

	async _onAdvancedEditing() {
		const location = `/d2l/le/contentservice/producer/${this._contentId}/view`;
		let dialog = null;
		let topWindow = null;

		const onResize = () => {
			dialog.style.width = 'calc(100% - 50px)';
			dialog.style.maxWidth = '1200px';
			dialog.style.left = `${(topWindow.innerWidth - dialog.offsetWidth) / 2}px`;
			dialog.style.top = `calc(${topWindow.scrollY}px + 25px)`;
			dialog.style.height = 'calc(100% - 50px)';
		};

		const dialogResult = await D2L.LP.Web.UI.Desktop.MasterPages.Dialog.Open(
			getComposedActiveElement(),
			new D2L.LP.Web.Http.UrlLocation(location),
			{
				Onload: (handle) => {
					setTimeout(() => {
						dialog = handle.dialog;
						topWindow = handle.win.top;
						onResize();
						topWindow.addEventListener('resize', onResize);
					}, 500);
				}
			}
		);

		await new Promise(resolve => {
			dialogResult.AddReleaseListener(() => {
				topWindow.removeEventListener('resize', onResize);
				resolve();
			});
		});

		if (this.topicId) {
			const contentViewer = this.shadowRoot.getElementById('content-viewer');
			await contentViewer.reloadResources();
			contentViewer.requestUpdate();
		} else {
			await this._loadMediaPlayerSources();
		}
	}

	_onChangeFile() {
		this.dispatchEvent(new CustomEvent('cancel', {
			bubbles: true,
			composed: true
		}));
	}

	_onMediaPlayerError() {
		if (this._mediaSources && this._mediaSources.length > 0) {
			const expires = this._mediaSources[0].expires;
			if (this._lastRefreshAttempted !== expires && expires - Date.now() < 0) {
				// Prevent multiple attempts to load with same URLs
				this._lastRefreshAttempted = expires;

				// Get new signed URLs and load them
				this._loadMediaPlayerSources();
			}
		}
	}

	_renderContentViewer() {
		return html`
			<d2l-content-viewer
				id="content-viewer"
				org-unit-id=${this.orgUnitId}
				topic-id=${this.topicId}>
			</d2l-content-viewer>`;
	}

	_renderMediaSources() {
		if (!this._mediaSources) {
			return html``;
		}

		return html`
			<d2l-labs-media-player
				@error=${this._onMediaPlayerError}
				media-type="${this._isAudio() ? 'audio' : 'video'}"
				style="width:100%"
			>
				${this._mediaSources.map(mediaSource => this._renderSource(mediaSource))}
			</d2l-labs-media-player>`;
	}

	_renderPreviewPlayer() {
		if (this.topicId) {
			return this._renderContentViewer();
		} else {
			return this._renderMediaSources();
		}
	}

	_renderSource(source) {
		return html`<source src=${source.src} label=${this.localize(`format${source.format.toUpperCase()}`)} ?default=${source.format === 'hd'}>`;
	}
}

customElements.define('d2l-content-uploader-preview', Preview);
